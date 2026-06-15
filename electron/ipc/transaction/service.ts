import { createTransaction, getTransactionById, listTransactions, updateTransactionStatus, esc } from './repo.ts';
export { listTransactions, getTransactionsByCustomerId } from './repo.ts';
import type { TransactionWithItems } from '../../db/schema.ts';
import { getDb } from '../../db/index.ts';

// ─── Error Codes ─────────────────────────────────────────────────────────────
export const TRANS_ERR = {
  INSUFFICIENT_STOCK: { code: 'TRANS_001', message: 'Stok tidak mencukupi' },
  INVALID_PAYMENT: { code: 'TRANS_002', message: 'Jumlah pembayaran kurang' },
  ALREADY_VOIDED: { code: 'TRANS_003', message: 'Transaksi sudah dibatalkan' },
  ALREADY_REFUNDED: { code: 'TRANS_004', message: 'Transaksi sudah diretur' },
  NO_OPEN_SHIFT: { code: 'TRANS_005', message: 'Buka shift terlebih dahulu' },
} as const;

// ─── DTOs ────────────────────────────────────────────────────────────────────
export interface CreateTransactionDTO {
  userId: string;
  customerId?: string;
  subtotal: number;
  discount: number;
  discountPercent: number;
  tax: number;
  taxPercent: number;
  total: number;
  paymentMethod: string;
  amountPaid: number;
  change: number;
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
    availableStock?: number;
  }>;
}

export interface VoidTransactionDTO {
  reason: string;
}

export interface RefundTransactionDTO {
  items?: Array<{ productId: string; quantity: number }>;
}

// ─── Transaction Service ─────────────────────────────────────────────────────

export async function createSaleTransaction(dto: CreateTransactionDTO): Promise<TransactionWithItems> {
  // Validate stock
  for (const item of dto.items) {
    if (item.availableStock !== undefined && item.quantity > item.availableStock) {
      throw Object.assign(new Error(TRANS_ERR.INSUFFICIENT_STOCK.message), {
        code: TRANS_ERR.INSUFFICIENT_STOCK.code,
        productId: item.productId,
        productName: item.productName,
        requested: item.quantity,
        available: item.availableStock,
      });
    }
  }

  const db = await getDb();
  console.log('[STOCK] createSaleTransaction items:', JSON.stringify(dto.items.map(i => ({ id: i.productId, qty: i.quantity }))));

  const tx = await createTransaction({
    ...dto,
    status: 'completed',
  });

  for (const item of dto.items) {
    try {
      const sql = `UPDATE products SET stock = MAX(0, stock - ${item.quantity}), updated_at = ${Date.now()} WHERE id = '${esc(item.productId)}'`;
      console.log('[STOCK] running:', sql);
      const result = db.run(sql);
      console.log('[STOCK] done, result:', result);
    } catch (e) {
      console.error('[STOCK] Gagal update stock:', item.productId, 'qty:', item.quantity, e);
    }
  }

  // Verify stock after update
  const productRows = db.exec(`SELECT id, name, stock FROM products WHERE id IN (${dto.items.map(i => `'${esc(i.productId)}'`).join(',')})`);
  if (productRows[0]) {
    productRows[0].values.forEach((r: any) => {
      console.log('[STOCK] after update - id:', r[0], 'name:', r[1], 'stock:', r[2]);
    });
  }

  return tx;
}

export async function holdTransaction(dto: Pick<CreateTransactionDTO, 'userId' | 'items' | 'subtotal' | 'notes'>): Promise<TransactionWithItems> {
  const invoiceNumber = `HLD-${Date.now()}`;
  return createTransaction({
    ...dto,
    invoiceNumber,
    subtotal: dto.subtotal,
    discount: 0,
    discountPercent: 0,
    tax: 0,
    taxPercent: 0,
    total: dto.subtotal,
    paymentMethod: 'cash',
    amountPaid: 0,
    change: 0,
    status: 'held',
    shiftId: undefined,
  });
}

export async function retrieveHeldTransaction(id: string): Promise<TransactionWithItems | null> {
  return getTransactionById(id);
}

export async function listHeldTransactions(): Promise<TransactionWithItems[]> {
  return listTransactions({ status: 'held' });
}

export async function voidTransaction(id: string, reason: string): Promise<TransactionWithItems | null> {
  const tx = await getTransactionById(id);
  if (!tx) throw new Error('Transaksi tidak ditemukan');
  if (tx.status === 'voided') throw Object.assign(new Error(TRANS_ERR.ALREADY_VOIDED.message), {
    code: TRANS_ERR.ALREADY_VOIDED.code,
  });
  if (tx.status === 'refunded') throw Object.assign(new Error('Transaksi sudah diretur'), {
    code: 'TRANS_003',
  });

  // Restore stock only for completed/held transactions (held never deducted stock)
  if (tx.status !== 'held') {
    const { updateProductStock } = await import('./../product/service.ts');
    for (const item of tx.items) {
      await updateProductStock(item.productId, item.quantity);
    }
  }

  return updateTransactionStatus(id, 'voided', reason);
}

export async function bulkDeleteHeldTransactions(ids: string[]): Promise<TransactionWithItems[]> {
  const results: TransactionWithItems[] = [];
  for (const id of ids) {
    const tx = await getTransactionById(id);
    if (!tx) continue;
    // Held bills don't need stock restoration
    const updated = await updateTransactionStatus(id, 'voided', 'Dihapus oleh kasir');
    if (updated) results.push(updated);
  }
  return results;
}

export async function refundTransaction(
  id: string,
  items?: Array<{ productId: string; quantity: number }>,
): Promise<TransactionWithItems | null> {
  const tx = await getTransactionById(id);
  if (!tx) throw new Error('Transaksi tidak ditemukan');
  if (tx.status === 'voided') throw Object.assign(new Error('Transaksi sudah dibatalkan'), {
    code: 'TRANS_003',
  });
  if (tx.status === 'refunded') throw Object.assign(new Error(TRANS_ERR.ALREADY_REFUNDED.message), {
    code: TRANS_ERR.ALREADY_REFUNDED.code,
  });

  // Restore stock for refunded items
  if (items && items.length > 0) {
    const { updateProductStock } = await import('./../product/service.ts');
    for (const item of items) {
      await updateProductStock(item.productId, item.quantity);
    }
  }

  return updateTransactionStatus(id, 'refunded', 'Refunded');
}

