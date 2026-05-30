import { getDb } from '../../db/index.ts';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface CategoryRow {
  id: string;
  name: string;
  parentId: string | null;
  parentName: string | null;
  isActive: boolean;
  createdAt: number;
  productCount: number;
}

export interface CategoryInput {
  name: string;
  parentId?: string | null;
  isActive?: boolean;
}

// ─── Mock Fallback ─────────────────────────────────────────────────────────────

const MOCK_CATEGORIES: CategoryRow[] = [
  { id: 'cat-all', name: 'Semua', parentId: null, parentName: null, isActive: true, createdAt: 0, productCount: 0 },
  { id: 'cat-minum', name: 'Minuman', parentId: null, parentName: null, isActive: true, createdAt: 0, productCount: 0 },
  { id: 'cat-makan', name: 'Makanan', parentId: null, parentName: null, isActive: true, createdAt: 0, productCount: 0 },
  { id: 'cat-snack', name: 'Snack', parentId: null, parentName: null, isActive: true, createdAt: 0, productCount: 0 },
  { id: 'cat-rokok', name: 'Rokok', parentId: null, parentName: null, isActive: true, createdAt: 0, productCount: 0 },
];

// ─── SQL Builder ────────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s.replace(/'/g, "''");
}

// ─── Service ───────────────────────────────────────────────────────────────────

export async function listCategories(): Promise<CategoryRow[]> {
  try {
    const db = await getDb();
    const result = db.exec(`
      SELECT
        c.id, c.name, c.parent_id, p.name,
        c.is_active, c.created_at,
        (SELECT COUNT(*) FROM products WHERE category_id = c.id AND is_active = 1) as product_count
      FROM categories c
      LEFT JOIN categories p ON c.parent_id = p.id
      ORDER BY c.name ASC
    `);
    if (result.length > 0 && result[0]!.values.length > 0) {
      return result[0]!.values.map((r: unknown[]) => ({
        id: String(r[0]),
        name: String(r[1]),
        parentId: r[2] != null ? String(r[2]) : null,
        parentName: r[3] != null ? String(r[3]) : null,
        isActive: Boolean(r[4]),
        createdAt: Number(r[5]) || 0,
        productCount: Number(r[6]) || 0,
      }));
    }
  } catch {
    // fallthrough to mock
  }
  return MOCK_CATEGORIES.map((c) => ({ ...c, productCount: 0 }));
}

export async function getCategoryById(id: string): Promise<CategoryRow | null> {
  try {
    const db = await getDb();
    const result = db.exec(`
      SELECT
        c.id, c.name, c.parent_id, p.name,
        c.is_active, c.created_at,
        (SELECT COUNT(*) FROM products WHERE category_id = c.id AND is_active = 1) as product_count
      FROM categories c
      LEFT JOIN categories p ON c.parent_id = p.id
      WHERE c.id = '${esc(id)}'
      LIMIT 1
    `);
    if (result.length > 0 && result[0]!.values.length > 0) {
      const r = result[0]!.values[0]!;
      return {
        id: String(r[0]),
        name: String(r[1]),
        parentId: r[2] != null ? String(r[2]) : null,
        parentName: r[3] != null ? String(r[3]) : null,
        isActive: Boolean(r[4]),
        createdAt: Number(r[5]) || 0,
        productCount: Number(r[6]) || 0,
      };
    }
  } catch { /* ignore */ }
  return MOCK_CATEGORIES.find((c) => c.id === id) || null;
}

export async function createCategory(input: CategoryInput): Promise<CategoryRow | { error: string }> {
  try {
    const db = await getDb();
    const id = `cat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // Check duplicate name
    const dup = db.exec(`SELECT id FROM categories WHERE name = '${esc(input.name)}' LIMIT 1`);
    if (dup.length > 0 && dup[0]!.values.length > 0) {
      return { error: `CAT_002: Kategori '${input.name}' sudah ada` };
    }

    db.run(
      `INSERT INTO categories (id, name, parent_id, is_active, created_at) VALUES (?, ?, ?, ?, ?)`,
      [
        id,
        input.name,
        input.parentId || null,
        input.isActive !== false ? 1 : 0,
        Date.now(),
      ]
    );

    return getCategoryById(id) as Promise<CategoryRow>;
  } catch (err) {
    return { error: (err as Error)?.message || 'Gagal membuat kategori' };
  }
}

export async function updateCategory(id: string, input: CategoryInput): Promise<CategoryRow | { error: string }> {
  try {
    const db = await getDb();
    const existing = await getCategoryById(id);
    if (!existing) return { error: `CAT_003: Kategori dengan id '${id}' tidak ditemukan` };

    // Check duplicate name (excluding self)
    if (input.name && input.name !== existing.name) {
      const dup = db.exec(`SELECT id FROM categories WHERE name = '${esc(input.name)}' AND id != '${esc(id)}' LIMIT 1`);
      if (dup.length > 0 && dup[0]!.values.length > 0) {
        return { error: `CAT_002: Kategori '${input.name}' sudah ada` };
      }
    }

    // Prevent self-parent
    const newParentId = input.parentId ?? existing.parentId;
    if (newParentId === id) {
      return { error: 'CAT_004: Kategori tidak bisa menjadi parent dirinya sendiri' };
    }

    // Prevent circular parent: walk up the tree to check if id is ancestor of newParentId
    if (newParentId) {
      let currentParent: string | null = newParentId;
      const visited = new Set<string>();
      while (currentParent) {
        if (currentParent === id) return { error: 'CAT_004: Hubungan parent melingkar terdeteksi' };
        if (visited.has(currentParent)) break;
        visited.add(currentParent);
        const parentRow = db.exec(`SELECT parent_id FROM categories WHERE id = '${esc(currentParent)}' LIMIT 1`);
        if (parentRow.length > 0 && parentRow[0]!.values.length > 0) {
          currentParent = parentRow[0]!.values[0]![0] != null ? String(parentRow[0]!.values[0]![0]) : null;
        } else {
          currentParent = null;
        }
      }
    }

    const sets: string[] = [];
    const params: unknown[] = [];

    if (input.name !== undefined) { sets.push('name = ?'); params.push(input.name); }
    if (input.parentId !== undefined) { sets.push('parent_id = ?'); params.push(input.parentId || null); }
    if (input.isActive !== undefined) { sets.push('is_active = ?'); params.push(input.isActive ? 1 : 0); }

    if (sets.length > 0) {
      db.run(`UPDATE categories SET ${sets.join(', ')} WHERE id = ?`, [...params, id]);
    }

    return getCategoryById(id) as Promise<CategoryRow>;
  } catch (err) {
    return { error: (err as Error)?.message || 'Gagal memperbarui kategori' };
  }
}

export async function deleteCategory(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDb();
    const existing = await getCategoryById(id);
    if (!existing) return { success: false, error: `CAT_003: Kategori dengan id '${id}' tidak ditemukan` };

    // Check if has products
    const prodResult = db.exec(`SELECT COUNT(*) FROM products WHERE category_id = '${esc(id)}' AND is_active = 1 LIMIT 1`);
    const productCount = prodResult.length > 0 ? Number(prodResult[0]!.values[0]![0]) : 0;

    if (productCount > 0) {
      return { success: false, error: `CAT_001: Kategori '${existing.name}' masih memiliki ${productCount} produk aktif` };
    }

    // Check if has children
    const childResult = db.exec(`SELECT COUNT(*) FROM categories WHERE parent_id = '${esc(id)}' LIMIT 1`);
    const childCount = childResult.length > 0 ? Number(childResult[0]!.values[0]![0]) : 0;

    if (childCount > 0) {
      return { success: false, error: `CAT_004: Kategori '${existing.name}' masih memiliki ${childCount} sub-kategori` };
    }

    db.run(`DELETE FROM categories WHERE id = ?`, [id]);
    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error)?.message || 'Gagal menghapus kategori' };
  }
}
