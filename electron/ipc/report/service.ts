import { getDb } from '../../db/index.ts';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReportParams {
  startDate: number; // unix timestamp seconds
  endDate: number;   // unix timestamp seconds
}

export interface SalesSummary {
  totalRevenue: number;       // cents
  totalTransactions: number;
  averageTicket: number;      // cents
  totalItems: number;
  totalDiscount: number;      // cents
  totalTax: number;           // cents
  totalCogs: number;          // cents — cost of goods sold
  totalProfit: number;        // cents — revenue - discount - cogs
}

export interface SalesByDay {
  date: string;               // YYYY-MM-DD
  revenue: number;            // cents
  transactions: number;
}

export interface SalesByProduct {
  productId: string;
  productName: string;
  quantity: number;
  revenue: number;            // cents
}

export interface SalesByCategory {
  categoryName: string;
  revenue: number;            // cents
  quantity: number;
}

export interface SalesByPayment {
  method: string;
  total: number;              // cents
  count: number;
}

export interface SalesByCashier {
  userId: string;
  userName: string;
  total: number;              // cents
  transactions: number;
}

export interface SalesByShift {
  shiftId: string | null;
  userName: string;
  openedAt: number;
  closedAt: number | null;
  status: string;
  total: number;
  transactions: number;
}

export interface SalesReport {
  params: ReportParams;
  summary: SalesSummary;
  byDay: SalesByDay[];
  byProduct: SalesByProduct[];
  byCategory: SalesByCategory[];
  byPayment: SalesByPayment[];
  byCashier: SalesByCashier[];
  byShift: SalesByShift[];
}

export interface StockReportRow {
  productId: string;
  productName: string;
  sku: string | null;
  categoryName: string | null;
  currentStock: number;
  baseUnit: string;
  minStock: number;
  status: 'ok' | 'low' | 'out';
  stockValue: number;         // cents (priceBuy * stock)
}

export interface StockReport {
  asOfDate: number;
  products: StockReportRow[];
  totalValue: number;         // cents
  lowStockCount: number;
  outOfStockCount: number;
}

export interface FinanceDailyRow {
  date: string;
  revenue: number;
  transactions: number;
}

export interface FinanceReport {
  params: ReportParams;
  revenue: number;            // cents
  discount: number;           // cents
  tax: number;                // cents
  netRevenue: number;         // cents (revenue - discount)
  byDay: FinanceDailyRow[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s.replace(/'/g, "''");
}

function rowsToObjects(result: any[]): Record<string, any>[] {
  if (!result[0] || result[0].values.length === 0) return [];
  const cols: string[] = result[0].columns;
  return result[0].values.map((row: any[]) => {
    const obj: Record<string, any> = {};
    cols.forEach((col, i) => { obj[col] = row[i]; });
    return obj;
  });
}

// ─── Sales Report ─────────────────────────────────────────────────────────────

export async function getSalesReport(params: ReportParams): Promise<SalesReport> {
  const db = await getDb();
  const { startDate, endDate } = params;

  // Summary
  const summaryRows = rowsToObjects(db.exec(`
    SELECT
      COALESCE(SUM(total), 0)        AS total_revenue,
      COUNT(*)                        AS total_transactions,
      COALESCE(AVG(total), 0)         AS average_ticket,
      COALESCE(SUM(discount), 0)      AS total_discount,
      COALESCE(SUM(tax), 0)           AS total_tax
    FROM transactions
    WHERE status = 'completed'
      AND created_at >= ${startDate}
      AND created_at <= ${endDate}
  `));

  const s = summaryRows[0] ?? {};

  // Total items
  const itemCountRows = rowsToObjects(db.exec(`
    SELECT COALESCE(SUM(ti.quantity), 0) AS total_items
    FROM transaction_items ti
    JOIN transactions t ON ti.transaction_id = t.id
    WHERE t.status = 'completed'
      AND t.created_at >= ${startDate}
      AND t.created_at <= ${endDate}
  `));

  // COGS (cost of goods sold) — quantity sold × purchase price
  const cogsRows = rowsToObjects(db.exec(`
    SELECT COALESCE(SUM(ti.quantity * p.price_buy), 0) AS total_cogs
    FROM transaction_items ti
    JOIN transactions t ON ti.transaction_id = t.id
    LEFT JOIN products p ON ti.product_id = p.id
    WHERE t.status = 'completed'
      AND t.created_at >= ${startDate}
      AND t.created_at <= ${endDate}
  `));

  const totalCogs = Number(cogsRows[0]?.total_cogs) || 0;
  const totalRevenue = Number(s.total_revenue) || 0;
  const totalDiscount = Number(s.total_discount) || 0;

  const summary: SalesSummary = {
    totalRevenue,
    totalTransactions: Number(s.total_transactions) || 0,
    averageTicket: Math.round(Number(s.average_ticket) || 0),
    totalItems: Number(itemCountRows[0]?.total_items) || 0,
    totalDiscount,
    totalTax: Number(s.total_tax) || 0,
    totalCogs,
    totalProfit: totalRevenue - totalDiscount - totalCogs,
  };

  // By day
  const byDayRows = rowsToObjects(db.exec(`
    SELECT
      date(created_at, 'unixepoch', 'localtime') AS date,
      SUM(total)  AS revenue,
      COUNT(*)    AS transactions
    FROM transactions
    WHERE status = 'completed'
      AND created_at >= ${startDate}
      AND created_at <= ${endDate}
    GROUP BY date
    ORDER BY date ASC
  `));

  const byDay: SalesByDay[] = byDayRows.map((r) => ({
    date: String(r.date),
    revenue: Number(r.revenue) || 0,
    transactions: Number(r.transactions) || 0,
  }));

  // By product
  const byProductRows = rowsToObjects(db.exec(`
    SELECT
      ti.product_id   AS product_id,
      ti.product_name AS product_name,
      SUM(ti.quantity) AS quantity,
      SUM(ti.total)    AS revenue
    FROM transaction_items ti
    JOIN transactions t ON ti.transaction_id = t.id
    WHERE t.status = 'completed'
      AND t.created_at >= ${startDate}
      AND t.created_at <= ${endDate}
    GROUP BY ti.product_id, ti.product_name
    ORDER BY revenue DESC
    LIMIT 50
  `));

  const byProduct: SalesByProduct[] = byProductRows.map((r) => ({
    productId: String(r.product_id),
    productName: String(r.product_name),
    quantity: Number(r.quantity) || 0,
    revenue: Number(r.revenue) || 0,
  }));

  // By category
  const byCategoryRows = rowsToObjects(db.exec(`
    SELECT
      COALESCE(c.name, 'Tanpa Kategori') AS category_name,
      SUM(ti.total)     AS revenue,
      SUM(ti.quantity)  AS quantity
    FROM transaction_items ti
    JOIN transactions t ON ti.transaction_id = t.id
    LEFT JOIN products p ON ti.product_id = p.id
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE t.status = 'completed'
      AND t.created_at >= ${startDate}
      AND t.created_at <= ${endDate}
    GROUP BY c.name
    ORDER BY revenue DESC
  `));

  const byCategory: SalesByCategory[] = byCategoryRows.map((r) => ({
    categoryName: String(r.category_name),
    revenue: Number(r.revenue) || 0,
    quantity: Number(r.quantity) || 0,
  }));

  // By payment method
  const byPaymentRows = rowsToObjects(db.exec(`
    SELECT
      payment_method AS method,
      SUM(total)     AS total,
      COUNT(*)       AS count
    FROM transactions
    WHERE status = 'completed'
      AND created_at >= ${startDate}
      AND created_at <= ${endDate}
    GROUP BY payment_method
    ORDER BY total DESC
  `));

  const byPayment: SalesByPayment[] = byPaymentRows.map((r) => ({
    method: String(r.method),
    total: Number(r.total) || 0,
    count: Number(r.count) || 0,
  }));

  // By cashier
  const byCashierRows = rowsToObjects(db.exec(`
    SELECT
      t.user_id   AS user_id,
      COALESCE(u.name, t.user_id) AS user_name,
      SUM(t.total) AS total,
      COUNT(*)     AS transactions
    FROM transactions t
    LEFT JOIN users u ON t.user_id = u.id
    WHERE t.status = 'completed'
      AND t.created_at >= ${startDate}
      AND t.created_at <= ${endDate}
    GROUP BY t.user_id
    ORDER BY total DESC
  `));

  const byCashier: SalesByCashier[] = byCashierRows.map((r) => ({
    userId: String(r.user_id),
    userName: String(r.user_name),
    total: Number(r.total) || 0,
    transactions: Number(r.transactions) || 0,
  }));

  // By shift
  const byShiftRows = rowsToObjects(db.exec(`
    SELECT
      t.shift_id                       AS shift_id,
      COALESCE(u.name, 'Tanpa Shift')  AS user_name,
      COALESCE(s.opened_at, 0)         AS opened_at,
      s.closed_at                      AS closed_at,
      COALESCE(s.status, '-')          AS status,
      COUNT(*)                         AS transactions,
      SUM(t.total)                     AS total
    FROM transactions t
    LEFT JOIN shifts s ON t.shift_id = s.id
    LEFT JOIN users u ON s.user_id = u.id
    WHERE t.status = 'completed'
      AND t.created_at >= ${startDate}
      AND t.created_at <= ${endDate}
    GROUP BY t.shift_id
    ORDER BY s.opened_at DESC NULLS LAST
  `));

  const byShift: SalesByShift[] = byShiftRows.map((r) => ({
    shiftId: r.shift_id ? String(r.shift_id) : null,
    userName: String(r.user_name),
    openedAt: Number(r.opened_at) || 0,
    closedAt: r.closed_at !== null && r.closed_at !== undefined ? Number(r.closed_at) : null,
    status: String(r.status),
    total: Number(r.total) || 0,
    transactions: Number(r.transactions) || 0,
  }));

  return { params, summary, byDay, byProduct, byCategory, byPayment, byCashier, byShift };
}

// ─── Stock Report ─────────────────────────────────────────────────────────────

export async function getStockReport(): Promise<StockReport> {
  const db = await getDb();
  const asOfDate = Math.floor(Date.now() / 1000);

  const rows = rowsToObjects(db.exec(`
    SELECT
      p.id            AS product_id,
      p.name          AS product_name,
      p.sku           AS sku,
      c.name          AS category_name,
      p.stock         AS current_stock,
      p.base_unit     AS base_unit,
      p.min_stock     AS min_stock,
      p.price_buy     AS price_buy
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE c.is_active = 1 OR c.id IS NULL
    ORDER BY p.name ASC
  `));

  let totalValue = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  const products: StockReportRow[] = rows.map((r) => {
    const stock = Number(r.current_stock) || 0;
    const minStock = Number(r.min_stock) || 0;
    const priceBuy = Number(r.price_buy) || 0;
    const stockValue = stock * priceBuy;

    let status: 'ok' | 'low' | 'out' = 'ok';
    if (stock <= 0) { status = 'out'; outOfStockCount++; }
    else if (stock <= minStock) { status = 'low'; lowStockCount++; }

    totalValue += stockValue;

    return {
      productId: String(r.product_id),
      productName: String(r.product_name),
      sku: r.sku ? String(r.sku) : null,
      categoryName: r.category_name ? String(r.category_name) : null,
      currentStock: stock,
      baseUnit: String(r.base_unit),
      minStock,
      status,
      stockValue,
    };
  });

  return { asOfDate, products, totalValue, lowStockCount, outOfStockCount };
}

// ─── Finance Report ───────────────────────────────────────────────────────────

export async function getFinanceReport(params: ReportParams): Promise<FinanceReport> {
  const db = await getDb();
  const { startDate, endDate } = params;

  const summaryRows = rowsToObjects(db.exec(`
    SELECT
      COALESCE(SUM(total), 0)    AS revenue,
      COALESCE(SUM(discount), 0) AS discount,
      COALESCE(SUM(tax), 0)      AS tax
    FROM transactions
    WHERE status = 'completed'
      AND created_at >= ${startDate}
      AND created_at <= ${endDate}
  `));

  const s = summaryRows[0] ?? {};
  const revenue = Number(s.revenue) || 0;
  const discount = Number(s.discount) || 0;
  const tax = Number(s.tax) || 0;

  const byDayRows = rowsToObjects(db.exec(`
    SELECT
      date(created_at, 'unixepoch', 'localtime') AS date,
      SUM(total)  AS revenue,
      COUNT(*)    AS transactions
    FROM transactions
    WHERE status = 'completed'
      AND created_at >= ${startDate}
      AND created_at <= ${endDate}
    GROUP BY date
    ORDER BY date ASC
  `));

  const byDay: FinanceDailyRow[] = byDayRows.map((r) => ({
    date: String(r.date),
    revenue: Number(r.revenue) || 0,
    transactions: Number(r.transactions) || 0,
  }));

  return {
    params,
    revenue,
    discount,
    tax,
    netRevenue: revenue - discount,
    byDay,
  };
}
