import { getDb } from '../../db/index.ts';
import type { NewCustomer } from '../../db/schema.ts';

// ─── Customer Row (matches sql.js raw result shape) ─────────────────────────────

export interface CustomerRow {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  totalSpent: number;
  isActive: boolean;
  createdAt: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s.replace(/'/g, "''");
}

function rowToCustomer(row: unknown[]): CustomerRow {
  return {
    id: String(row[0]),
    name: String(row[1]),
    phone: row[2] != null ? String(row[2]) : null,
    email: row[3] != null ? String(row[3]) : null,
    address: row[4] != null ? String(row[4]) : null,
    points: Number(row[5]) || 0,
    tier: (String(row[6]) as CustomerRow['tier']) || 'bronze',
    totalSpent: Number(row[7]) || 0,
    isActive: Boolean(row[8]),
    createdAt: Number(row[9]) || 0,
  };
}

// ─── Customer Repository ────────────────────────────────────────────────────────

export async function listCustomers(filter?: {
  search?: string;
  isActive?: boolean;
}): Promise<CustomerRow[]> {
  try {
    const db = await getDb();
    const parts: string[] = ['1=1'];

    if (filter?.isActive !== undefined) {
      parts.push(`is_active = ${filter.isActive ? 1 : 0}`);
    }
    if (filter?.search) {
      const q = `%${esc(filter.search)}%`;
      parts.push(`(name LIKE '%${q}' OR phone LIKE '%${q}')`);
    }

    const where = parts.length > 0 ? `WHERE ${parts.join(' AND ')}` : '';
    const sql = `SELECT id, name, phone, email, address, points, tier, total_spent, is_active, created_at FROM customers ${where} ORDER BY name ASC`;

    const result = db.exec(sql);
    if (result.length > 0 && result[0]!.values.length > 0) {
      return result[0]!.values.map((r: unknown[]) => rowToCustomer(r));
    }
  } catch {
    // ignore
  }
  return [];
}

export async function getCustomerById(id: string): Promise<CustomerRow | null> {
  try {
    const db = await getDb();
    const result = db.exec(`SELECT id, name, phone, email, address, points, tier, total_spent, is_active, created_at FROM customers WHERE id = '${esc(id)}' LIMIT 1`);
    if (result.length > 0 && result[0]!.values.length > 0) {
      return rowToCustomer(result[0]!.values[0] as unknown[]);
    }
  } catch {
    // ignore
  }
  return null;
}

export async function getCustomerByPhone(phone: string): Promise<CustomerRow | null> {
  try {
    const db = await getDb();
    const result = db.exec(`SELECT id, name, phone, email, address, points, tier, total_spent, is_active, created_at FROM customers WHERE phone = '${esc(phone)}' LIMIT 1`);
    if (result.length > 0 && result[0]!.values.length > 0) {
      return rowToCustomer(result[0]!.values[0] as unknown[]);
    }
  } catch {
    // ignore
  }
  return null;
}

export async function createCustomer(input: Omit<NewCustomer, 'id'>): Promise<CustomerRow | { error: string }> {
  try {
    const db = await getDb();

    // Check duplicate phone
    if (input.phone) {
      const dup = db.exec(`SELECT id FROM customers WHERE phone = '${esc(input.phone)}' LIMIT 1`);
      if (dup.length > 0 && dup[0]!.values.length > 0) {
        return { error: `CUST_001: Nomor telepon '${input.phone}' sudah terdaftar` };
      }
    }

    const id = `cust_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = Math.floor(Date.now() / 1000);

    db.run(
      `INSERT INTO customers (id, name, phone, email, address, points, tier, total_spent, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.name,
        input.phone || null,
        input.email || null,
        input.address || null,
        input.points ?? 0,
        input.tier || 'bronze',
        input.totalSpent || 0,
        input.isActive !== false ? 1 : 0,
        now,
      ]
    );

    const created = await getCustomerById(id);
    return created as CustomerRow;
  } catch (err: any) {
    return { error: err.message || 'Gagal membuat pelanggan' };
  }
}

export async function updateCustomer(id: string, input: Partial<NewCustomer>): Promise<CustomerRow | { error: string }> {
  try {
    const db = await getDb();
    const existing = await getCustomerById(id);
    if (!existing) return { error: `CUST_003: Pelanggan dengan id '${id}' tidak ditemukan` };

    const sets: string[] = [];
    const params: unknown[] = [];

    if (input.name !== undefined) { sets.push('name = ?'); params.push(input.name); }
    if (input.phone !== undefined) { sets.push('phone = ?'); params.push(input.phone || null); }
    if (input.email !== undefined) { sets.push('email = ?'); params.push(input.email || null); }
    if (input.address !== undefined) { sets.push('address = ?'); params.push(input.address || null); }
    if (input.points !== undefined) { sets.push('points = ?'); params.push(input.points); }
    if (input.tier !== undefined) { sets.push('tier = ?'); params.push(input.tier); }
    if (input.totalSpent !== undefined) { sets.push('total_spent = ?'); params.push(input.totalSpent); }
    if (input.isActive !== undefined) { sets.push('is_active = ?'); params.push(input.isActive ? 1 : 0); }

    if (sets.length > 0) {
      db.run(`UPDATE customers SET ${sets.join(', ')} WHERE id = ?`, [...params, id]);
    }

    const updated = await getCustomerById(id);
    return updated || { error: `CUST_003: Pelanggan dengan id '${id}' tidak ditemukan` };
  } catch (err: any) {
    return { error: err.message || 'Gagal memperbarui pelanggan' };
  }
}

export async function deleteCustomer(id: string, soft = true): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDb();
    const existing = await getCustomerById(id);
    if (!existing) return { success: false, error: `CUST_003: Pelanggan dengan id '${id}' tidak ditemukan` };

    if (soft) {
      db.run(`UPDATE customers SET is_active = 0 WHERE id = ?`, [id]);
      return { success: true };
    }

    db.run(`DELETE FROM customers WHERE id = ?`, [id]);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal menghapus pelanggan' };
  }
}

export async function addPoints(id: string, points: number): Promise<CustomerRow | { error: string }> {
  try {
    const db = await getDb();
    const existing = await getCustomerById(id);
    if (!existing) return { error: `CUST_003: Pelanggan tidak ditemukan` };

    const newPoints = Math.max(0, existing.points + points);
    db.run(`UPDATE customers SET points = ? WHERE id = ?`, [newPoints, id]);
    const updated = await getCustomerById(id);
    return updated || { error: `CUST_003: Pelanggan tidak ditemukan` };
  } catch (err: any) {
    return { error: err.message || 'Gagal menambahkan poin' };
  }
}

/**
 * Dipanggil setelah transaksi selesai.
 * Update points, total_spent, dan tier sekaligus.
 */
export async function recordTransactionPoints(
  id: string,
  transactionTotalCents: number
): Promise<{ customer: CustomerRow; earnedPoints: number } | { error: string }> {
  try {
    const db = await getDb();
    const existing = await getCustomerById(id);
    if (!existing) return { error: `CUST_003: Pelanggan tidak ditemukan` };

    // Import service functions inline to avoid circular deps
    const { calculatePoints, calculateTier } = await import('./service.ts');

    const earned = calculatePoints(transactionTotalCents, existing.tier);
    const newPoints = existing.points + earned;
    const newTotalSpent = (existing.totalSpent || 0) + transactionTotalCents;
    const newTier = calculateTier(newTotalSpent);

    db.run(
      `UPDATE customers SET points = ?, total_spent = ?, tier = ? WHERE id = ?`,
      [newPoints, newTotalSpent, newTier, id]
    );

    const updated = await getCustomerById(id);
    if (!updated) return { error: `CUST_003: Pelanggan tidak ditemukan` };
    return { customer: updated, earnedPoints: earned };
  } catch (err: any) {
    return { error: err.message || 'Gagal update poin transaksi' };
  }
}

export async function redeemPoints(id: string, points: number): Promise<{ customer: CustomerRow; discount: number } | { error: string }> {
  try {
    const db = await getDb();
    const existing = await getCustomerById(id);
    if (!existing) return { error: `CUST_003: Pelanggan tidak ditemukan` };

    if (existing.points < points) {
      return { error: `CUST_002: Poin tidak cukup. Milik ${existing.points}, butuh ${points}` };
    }

    // 1 poin = Rp 100
    const discount = points * 100;
    const newPoints = existing.points - points;

    db.run(`UPDATE customers SET points = ? WHERE id = ?`, [newPoints, id]);
    const updated = await getCustomerById(id);
    if (!updated) return { error: `CUST_003: Pelanggan tidak ditemukan` };
    return { customer: updated, discount };
  } catch (err: any) {
    return { error: err.message || 'Gagal menukar poin' };
  }
}
