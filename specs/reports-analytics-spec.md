# Technical Spec: Reports & Analytics

## 1. Overview

Module untuk dashboard, laporan penjualan, stok, keuangan, dan visualisasi data.

**Linked PRD Sections**: 5.5

---

## 2. Architecture

```
electron/
├── ipc/
│   └── report.ts                 # Report IPC handlers
├── services/
│   └── report/
│       ├── repo.ts             # Query builder for reports
│       └── service.ts          # Aggregation & calculation
└── utils/
    └── export.ts               # PDF/Excel export helpers

src/
├── components/
│   └── report/
│       ├── DashboardCards.tsx    # Summary cards (today, week, month)
│       ├── SalesChart.tsx        # Recharts line/bar chart
│       ├── ProductChart.tsx      # Top products pie chart
│       ├── ReportTable.tsx       # Sortable/filterable table
│       ├── DateRangePicker.tsx   # Custom date range
│       └── ExportButton.tsx      # PDF/Excel export
├── pages/
│   ├── DashboardPage.tsx
│   ├── SalesReportPage.tsx
│   ├── StockReportPage.tsx
│   └── FinanceReportPage.tsx
└── stores/
    └── reportStore.ts
```

---

## 3. Data Models

No new tables needed. Uses existing tables with aggregation queries.

### Report Types

```typescript
interface SalesReport {
  period: string;              // 'daily' | 'weekly' | 'monthly'
  dateRange: { start: Date; end: Date };
  summary: {
    totalSales: number;
    totalTransactions: number;
    averageTicket: number;
    totalItems: number;
  };
  byProduct: Array<{
    productId: string;
    productName: string;
    quantity: number;
    revenue: number;
  }>;
  byCategory: Array<{
    categoryId: string;
    categoryName: string;
    revenue: number;
  }>;
  byPaymentMethod: Record<PaymentMethod, number>;
}

interface StockReport {
  asOfDate: Date;
  products: Array<{
    productId: string;
    productName: string;
    currentStock: number;
    baseUnit: string;
    minStock: number;
    status: 'ok' | 'low' | 'out';
    stockValue: number;         // priceBuy * stock
  }>;
}

interface FinanceReport {
  dateRange: { start: Date; end: Date };
  summary: {
    revenue: number;
    cogs: number;               // cost of goods sold
    grossProfit: number;
    expenses: number;
    netProfit: number;
  };
  dailyBreakdown: Array<{
    date: string;
    revenue: number;
    profit: number;
  }>;
}
```

---

## 4. API / IPC Contract

```typescript
interface ReportAPI {
  // Dashboard
  'report:dashboard': () => Promise<DashboardSummary>;
  
  // Sales reports
  'report:sales': (params: ReportParams) => Promise<SalesReport>;
  'report:salesByProduct': (params: ReportParams) => Promise<SalesByProduct[]>;
  'report:salesByCategory': (params: ReportParams) => Promise<SalesByCategory[]>;
  'report:salesByCashier': (params: ReportParams) => Promise<SalesByCashier[]>;
  
  // Stock reports
  'report:stock': (asOfDate?: Date) => Promise<StockReport>;
  'report:stockMovement': (productId: string, params: ReportParams) => Promise<StockMovement[]>;
  
  // Finance
  'report:finance': (params: ReportParams) => Promise<FinanceReport>;
  
  // Export
  'report:export': (type: 'pdf' | 'excel', params: ReportParams) => Promise<string>; // file path
}
```

---

## 5. Dashboard Summary

```typescript
// electron/services/report/service.ts

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const today = new Date();
  const weekAgo = subDays(today, 7);
  const monthAgo = subDays(today, 30);
  
  return {
    today: await getPeriodSummary(today, today),
    thisWeek: await getPeriodSummary(weekAgo, today),
    thisMonth: await getPeriodSummary(monthAgo, today),
    alerts: {
      lowStock: await getLowStockCount(),
      heldBills: await getHeldBillCount(),
    },
  };
}

async function getPeriodSummary(start: Date, end: Date) {
  const transactions = await reportRepo.getTransactionsInRange(start, end);
  
  return {
    sales: transactions.reduce((sum, t) => sum + t.total, 0),
    transactions: transactions.length,
    averageTicket: transactions.length > 0 
      ? transactions.reduce((sum, t) => sum + t.total, 0) / transactions.length 
      : 0,
  };
}
```

---

## 6. State Management

```typescript
// src/stores/reportStore.ts
interface ReportState {
  dashboard: DashboardSummary | null;
  currentReport: ReportData | null;
  loading: boolean;
  dateRange: { start: Date; end: Date };
  
  fetchDashboard: () => Promise<void>;
  fetchSalesReport: (params: ReportParams) => Promise<void>;
  fetchStockReport: () => Promise<void>;
  fetchFinanceReport: (params: ReportParams) => Promise<void>;
  setDateRange: (start: Date, end: Date) => void;
  exportReport: (type: 'pdf' | 'excel') => Promise<void>;
}
```

---

## 7. Component Details

### DashboardCards.tsx
- 4 cards: Today's sales, This week, This month, Low stock alerts
- Auto-refresh every 5 minutes
- Click to navigate to detailed report

### SalesChart.tsx
- Recharts AreaChart for daily sales trend
- Toggle: revenue vs transaction count
- Date range picker integration

### ProductChart.tsx
- Recharts PieChart for top 10 products
- By revenue or by quantity

### ExportButton.tsx
- Dropdown: PDF or Excel
- Filename: `laporan-penjualan-2026-05-28.pdf`
- Loading state during generation

---

## 8. Export Implementation

```typescript
// electron/utils/export.ts

import { PDFDocument, PageSizes } from 'pdf-lib';
import * as XLSX from 'xlsx';

export async function generatePDF(
  report: ReportData, 
  title: string
): Promise<string> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage(PageSizes.A4);
  
  // Add title, date range, summary
  // Add table with report data
  
  const pdfBytes = await pdfDoc.save();
  const filePath = await writeTempFile(`${title}.pdf`, pdfBytes);
  return filePath;
}

export async function generateExcel(
  report: ReportData,
  title: string
): Promise<string> {
  const ws = XLSX.utils.json_to_sheet(report.data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, title);
  
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  const filePath = await writeTempFile(`${title}.xlsx`, buffer);
  return filePath;
}
```

---

## 9. Error Handling

| Error Code | Description | User Message (ID) |
|------------|-------------|-------------------|
| RPT_001 | Date range invalid | "Rentang tanggal tidak valid" |
| RPT_002 | No data | "Tidak ada data untuk periode ini" |
| RPT_003 | Export failed | "Gagal mengekspor laporan" |

---

## 10. Testing Strategy

### Unit Tests
- `report.service.test.ts` - Aggregation calculations
- `export.utils.test.ts` - PDF/Excel generation

### E2E Tests
- Dashboard loads with real data
- Date range filter updates chart
- Export PDF/Excel downloads
- Performance with 10k transactions
