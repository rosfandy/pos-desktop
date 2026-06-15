// ─── Types ─────────────────────────────────────────────────────────────────────

export interface UnitDef {
  id: string;
  productId: string;
  unitName: string;
  conversionFactor: number;
  priceSell: number | null;
  isDefault: boolean;
}

// ─── Errors ────────────────────────────────────────────────────────────────────

export class UnitConversionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnitConversionError';
  }
}

// ─── Conversion Functions ───────────────────────────────────────────────────────

/**
 * Convert quantity from a specific unit to the product's base unit.
 * Formula: baseQty = qty * conversionFactor
 *
 * @example convertToBaseUnit(2, 'kg', units) where kg has conversionFactor=1000 → 2000 (grams)
 * @example convertToBaseUnit(1, 'lusin', units) where lusin has conversionFactor=12 → 12 (pcs)
 */
export function convertToBaseUnit(qty: number, unitName: string, units: UnitDef[]): number {
  if (qty < 0) throw new UnitConversionError('PROD_003: Quantity tidak boleh negatif');
  if (!units || units.length === 0) throw new UnitConversionError('PROD_003: Daftar unit kosong');

  const unit = units.find((u) => u.unitName.toLowerCase() === unitName.toLowerCase());
  if (!unit) {
    const available = units.map((u) => u.unitName).join(', ');
    throw new UnitConversionError(`PROD_003: Unit '${unitName}' tidak ditemukan. Tersedia: ${available}`);
  }

  if (unit.conversionFactor <= 0) {
    throw new UnitConversionError(`PROD_003: conversionFactor untuk unit '${unit.unitName}' harus > 0 (saat ini: ${unit.conversionFactor})`);
  }

  return qty * unit.conversionFactor;
}

/**
 * Convert quantity from base unit to a specific named unit.
 * Formula: qtyInUnit = baseQty / conversionFactor
 * Returns integer if result is whole number, otherwise rounded to 3 decimal places.
 *
 * @example convertFromBaseUnit(500, 'kg', units) where kg has conversionFactor=1000 → 0.5 (kg)
 * @example convertFromBaseUnit(12, 'lusin', units) where lusin has conversionFactor=12 → 1 (lusin)
 */
export function convertFromBaseUnit(baseQty: number, unitName: string, units: UnitDef[]): number {
  if (baseQty < 0) throw new UnitConversionError('PROD_003: Quantity tidak boleh negatif');
  if (!units || units.length === 0) throw new UnitConversionError('PROD_003: Daftar unit kosong');

  const unit = units.find((u) => u.unitName.toLowerCase() === unitName.toLowerCase());
  if (!unit) {
    const available = units.map((u) => u.unitName).join(', ');
    throw new UnitConversionError(`PROD_003: Unit '${unitName}' tidak ditemukan. Tersedia: ${available}`);
  }

  if (unit.conversionFactor <= 0) {
    throw new UnitConversionError(`PROD_003: conversionFactor untuk unit '${unit.unitName}' harus > 0 (saat ini: ${unit.conversionFactor})`);
  }

  const result = baseQty / unit.conversionFactor;

  // Return integer if whole number, otherwise round to 3 decimal places
  return Math.abs(result - Math.round(result)) < 1e-9 ? Math.round(result) : Math.round(result * 1000) / 1000;
}

/**
 * Validate unit definitions for a product.
 * - No duplicate unit names (case-insensitive)
 * - All conversion factors > 0
 * - At least one unit must exist
 *
 * @throws UnitConversionError if validation fails
 */
export function validateUnits(units: UnitDef[]): void {
  if (!units || units.length === 0) {
    throw new UnitConversionError('PROD_003: Produk harus memiliki minimal 1 unit');
  }

  const seenNames = new Map<string, string>(); // lowerName → originalName
  for (const unit of units) {
    const lowerName = unit.unitName.toLowerCase().trim();
    if (!lowerName) {
      throw new UnitConversionError('PROD_003: Nama unit tidak boleh kosong');
    }
    if (seenNames.has(lowerName)) {
      throw new UnitConversionError(`PROD_003: Nama unit '${unit.unitName}' duplikat dengan '${seenNames.get(lowerName)}'`);
    }
    seenNames.set(lowerName, unit.unitName);
    if (unit.conversionFactor <= 0) {
      throw new UnitConversionError(`PROD_003: conversionFactor untuk '${unit.unitName}' harus > 0 (saat ini: ${unit.conversionFactor})`);
    }
  }
}

/**
 * Find the best unit name suggestion from a typed value.
 * Supports: 'kg', 'gr', 'lusin', 'pcs', 'botol', 'dus', etc.
 * Returns the matching unit name or null.
 */
export function suggestUnit(input: string, units: UnitDef[]): UnitDef | null {
  const lowered = input.toLowerCase().trim();
  return units.find((u) => u.unitName.toLowerCase() === lowered) || null;
}

/**
 * Get the default unit for a product.
 */
export function getDefaultUnit(units: UnitDef[]): UnitDef | null {
  return units.find((u) => u.isDefault) || units[0] || null;
}

/**
 * Get unit by name (case-insensitive).
 */
export function getUnit(unitName: string, units: UnitDef[]): UnitDef | null {
  return units.find((u) => u.unitName.toLowerCase() === unitName.toLowerCase()) || null;
}
