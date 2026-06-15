import { getDb } from '../../db/index.ts';
import { users, shifts, transactions, transactionItems } from '../../db/schema.ts';
import type { TransactionWithItems, TransactionItem } from '../../db/schema.ts';

// ─── Helpers ────────────────────────────────────────────────────────────────────

export function esc(s: string): string {
  return s.replace(/'/g, "''");
}

// ─── Invoice Number Generator ───────────────────────────────────────────────────
let invoiceCounter = 0;
let invoiceDate = '';

function initCounterForToday(db: any) {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  if (invoiceDate === today && invoiceCounter > 0) return;
  invoiceDate = today;

  const prefix = `INV-${today}-`;
  const rows = db.exec(`SELECT invoice_number FROM transactions WHERE invoice_number LIKE '${prefix}%' ORDER BY invoice_number DESC LIMIT 1`);
  if (rows[0] && rows[0].values.length > 0) {
    const lastNumber = rows[0].values[0][0] as string;
    const seq = parseInt(lastNumber.replace(prefix, ''), 10) || 0;
    invoiceCounter = seq;
  } else {
    invoiceCounter = 0;
  }
}

export function generateInvoiceNumber(db?: any): string {
  if (db) initCounterForToday(db);
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  invoiceCounter++;
  const seq = String(invoiceCounter).padStart(4, '0');
  return `INV-${today}-${seq}`;
}

// ─── Transaction Repository ──────────────────────────────────────────────────

export async function createTransaction(data: {
  invoiceNumber?: string;
  customerId?: string;
  userId: string;
  subtotal: number;
  discount: number;
  discountPercent: number;
  tax: number;
  taxPercent: number;
  total: number;
  paymentMethod: string;
  amountPaid: number;
  change: number;
  status: string;
  shiftId?: string;
  notes?: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unit: string;
    price: number;
    discount: number;
    total: number;
  }>;
}): Promise<TransactionWithItems> {
  const db = await getDb();

  const invoiceNumber = data.invoiceNumber || generateInvoiceNumber(db);
  const txId = crypto.randomUUID();

  db.run(
    `INSERT INTO transactions (id, invoice_number, customer_id, user_id, subtotal, discount, discount_percent, tax, tax_percent, total, payment_method, amount_paid, "change", status, created_at, shift_id, void_reason, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      txId,
      invoiceNumber,
      data.customerId || null,
      data.userId,
      data.subtotal,
      data.discount,
      data.discountPercent,
      data.tax,
      data.taxPercent,
      data.total,
      data.paymentMethod,
      data.amountPaid,
      data.change,
      data.status,
      Math.floor(Date.now() / 1000),
      data.shiftId || null,
      null,
      data.notes || null,
    ]
  );

  const itemsData = data.items.map((item) => ({
    id: crypto.randomUUID(),
    transactionId: txId,
    productId: item.productId,
    productName: item.productName,
    quantity: item.quantity,
    unit: item.unit,
    price: item.price,
    discount: item.discount,
    total: item.total,
  }));

  for (const item of itemsData) {
    db.run(
      `INSERT INTO transaction_items (id, transaction_id, product_id, product_name, quantity, unit, price, discount, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [item.id, item.transactionId, item.productId, item.productName, item.quantity, item.unit, item.price, item.discount, item.total]
    );
  }

  return { ...(await getTransactionById(txId)), items: itemsData.map(mapItem) } as TransactionWithItems;
}

export async function getTransactionById(id: string): Promise<TransactionWithItems | null> {
  const db = await getDb();
  const rows = db.exec(`SELECT t.*, u.name as user_name FROM transactions t LEFT JOIN users u ON t.user_id = u.id WHERE t.id = '${id.replace(/'/g, "''")}'`);
  if (!rows[0] || rows[0].values.length === 0) return null;

  const [row] = rows[0].values;
  const cols: string[] = rows[0].columns;

  const tx: Record<string, any> = {};
  cols.forEach((col: string, i: number) => { tx[col] = row[i]; });

  let customerName: string | null = null;
  if (tx.customer_id) {
    const cust = db.exec(`SELECT name FROM customers WHERE id = '${esc(tx.customer_id)}'`);
    if (cust[0] && cust[0].values.length > 0) {
      customerName = cust[0].values[0][0] as string;
    }
  }

  const itemRows = db.exec(`SELECT * FROM transaction_items WHERE transaction_id = '${id.replace(/'/g, "''")}'`);
  const items: TransactionItem[] = itemRows[0]
    ? itemRows[0].values.map((r: any[]) => ({
        id: r[0],
        transactionId: r[1],
        productId: r[2],
        productName: r[3],
        quantity: r[4],
        unit: r[5],
        price: r[6],
        discount: r[7],
        total: r[8],
      }))
    : [];

  return {
    id: tx.id,
    invoiceNumber: tx.invoice_number,
    customerId: tx.customer_id,
    customerName,
    userId: tx.user_id,
    subtotal: tx.subtotal,
    discount: tx.discount,
    discountPercent: tx.discount_percent,
    tax: tx.tax,
    taxPercent: tx.tax_percent,
    total: tx.total,
    paymentMethod: tx.payment_method,
    amountPaid: tx.amount_paid,
    change: tx.change,
    status: tx.status,
    createdAt: tx.created_at,
    shiftId: tx.shift_id,
    voidReason: tx.void_reason,
    notes: tx.notes || null,
    items,
    userName: tx.user_name || null,
  };
}

export async function listTransactions(_filters?: {
  dateFrom?: number;
  dateTo?: number;
  status?: string;
  userId?: string;
}): Promise<TransactionWithItems[]> {
  const db = await getDb();

  let where = '';
  if (_filters?.status) {
    const st = _filters.status.replace(/'/g, "''");
    where += ` WHERE t.status = '${st}'`;
  }

  const sql = `SELECT t.*, u.name as user_name FROM transactions t LEFT JOIN users u ON t.user_id = u.id${where} ORDER BY t.created_at DESC LIMIT 500`;
  const rows = db.exec(sql);

  if (!rows[0]) return [];

  const cols: string[] = rows[0].columns;
  const txMap = new Map<string, TransactionWithItems>();
  const result: TransactionWithItems[] = [];

  for (const row of rows[0].values) {
    const tx: Record<string, any> = {};
    cols.forEach((col: string, i: number) => { tx[col] = row[i]; });

    if (!txMap.has(tx.id)) {
      const entry: TransactionWithItems = {
        id: tx.id,
        invoiceNumber: tx.invoice_number,
        customerId: tx.customer_id,
        userId: tx.user_id,
        subtotal: tx.subtotal,
        discount: tx.discount,
        discountPercent: tx.discount_percent,
        tax: tx.tax,
        taxPercent: tx.tax_percent,
        total: tx.total,
        paymentMethod: tx.payment_method,
        amountPaid: tx.amount_paid,
        change: tx.change,
        status: tx.status,
        createdAt: tx.created_at,
        shiftId: tx.shift_id,
        voidReason: tx.void_reason,
        notes: tx.notes || null,
        items: [],
        userName: tx.user_name || null,
      };
      txMap.set(tx.id, entry);
      result.push(entry);
    }
  }

  for (const tx of result) {
    const itemRows = db.exec(`SELECT * FROM transaction_items WHERE transaction_id = '${tx.id.replace(/'/g, "''")}'`);
    if (itemRows[0]) {
      tx.items = itemRows[0].values.map((r: any[]) => ({
        id: r[0],
        transactionId: r[1],
        productId: r[2],
        productName: r[3],
        quantity: r[4],
        unit: r[5],
        price: r[6],
        discount: r[7],
        total: r[8],
      }));
    }
  }

  const customerIds = [...new Set(result.map((t) => t.customerId).filter(Boolean))] as string[];
  if (customerIds.length > 0) {
    const custRows = db.exec(`SELECT id, name FROM customers WHERE id IN (${customerIds.map((c) => `'${esc(c)}'`).join(',')})`);
    const custMap = new Map<string, string>();
    if (custRows[0]) {
      const cCols = custRows[0].columns;
      for (const r of custRows[0].values) {
        const obj: Record<string, any> = {};
        cCols.forEach((col, i) => { obj[col] = r[i]; });
        custMap.set(obj.id, obj.name);
      }
    }
    for (const tx of result) {
      if (tx.customerId) {
        (tx as any).customerName = custMap.get(tx.customerId) || null;
      }
    }
  }

  return result;
}

export async function updateTransactionStatus(
  id: string,
  status: string,
  voidReason?: string,
): Promise<TransactionWithItems | null> {
  const db = await getDb();
  db.run(
    `UPDATE transactions SET status = ?, void_reason = ? WHERE id = ?`,
    [status, voidReason || null, id]
  );
  return getTransactionById(id);
}

// ─── Customer Transaction History ─────────────────────────────────────────────

export interface CustomerTransactionRow {
  id: string;
  invoiceNumber: string;
  status: string;
  paymentMethod: string;
  total: number;
  subtotal: number;
  discount: number;
  tax: number;
  createdAt: number;
  itemCount: number;
  userName: string | null;
}

export async function getTransactionsByCustomerId(customerId: string, limit = 50): Promise<CustomerTransactionRow[]> {
  try {
    const db = await getDb();
    const sql = `
      SELECT t.id, t.invoice_number, t.status, t.payment_method,
             t.total, t.subtotal, t.discount, t.tax, t.created_at,
             (SELECT COUNT(*) FROM transaction_items WHERE transaction_id = t.id) as item_count,
             u.name as user_name
      FROM transactions t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.customer_id = '${esc(customerId)}'
      ORDER BY t.created_at DESC
      LIMIT ${limit}
    `;
    const result = db.exec(sql);
    if (result.length > 0 && result[0]!.values.length > 0) {
      return result[0]!.values.map((r: unknown[]) => ({
        id: String(r[0]),
        invoiceNumber: String(r[1]),
        status: String(r[2]),
        paymentMethod: String(r[3]),
        total: Number(r[4]) || 0,
        subtotal: Number(r[5]) || 0,
        discount: Number(r[6]) || 0,
        tax: Number(r[7]) || 0,
        createdAt: Number(r[8]) || 0,
        itemCount: Number(r[9]) || 0,
        userName: r[10] != null ? String(r[10]) : null,
      }));
    }
  } catch {
    // ignore
  }
  return [];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mapItem(item: TransactionItem) {
  return {
    id: item.id,
    transactionId: item.transactionId,
    productId: item.productId,
    productName: item.productName,
    quantity: item.quantity,
    unit: item.unit,
    price: item.price,
    discount: item.discount,
    total: item.total,
  };
}
