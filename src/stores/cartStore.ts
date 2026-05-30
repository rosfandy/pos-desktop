import { create } from 'zustand';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  unitConversion: number;    // conversion factor to base unit
  price: number;             // price per unit in cents
  discount: number;          // item-level discount in cents
  total: number;             // calculated total
}

export type PaymentMethod = 'cash' | 'debit' | 'qris' | 'transfer' | 'credit';

export interface CartState {
  items: CartItem[];
  customerId: string | null;
  loyaltyDiscountPercent: number;   // loyalty tier discount % applied to subtotal
  subtotal: number;
  discount: number;
  discountPercent: number;
  tax: number;
  taxPercent: number;
  total: number;
  amountPaid: number;
  change: number;
  paymentMethod: PaymentMethod;

  addItem: (product: CartItem) => void;
  removeItem: (productId: string, unit: string) => void;
  updateQuantity: (productId: string, unit: string, quantity: number) => void;
  updateItemDiscount: (productId: string, unit: string, discount: number) => void;
  setCustomer: (customerId: string | null, tierDiscountPercent: number) => void;
  setDiscount: (amount: number, percent?: number) => void;
  setTax: (percent: number) => void;
  setPayment: (method: PaymentMethod, amount: number) => void;
  calculateTotals: () => void;
  clearCart: () => void;
  holdBill: (notes?: string) => Promise<any>;
  loadHeldBill: (transaction: any) => void;
  deleteHeldBill: (id: string) => Promise<any>;
  pay: (userId?: string, shiftId?: string, payCustomerId?: string) => Promise<any>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// ─── Store ───────────────────────────────────────────────────────────────────

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  customerId: null,
  loyaltyDiscountPercent: 0,
  subtotal: 0,
  discount: 0,
  discountPercent: 0,
  tax: 0,
  taxPercent: 0,
  total: 0,
  amountPaid: 0,
  change: 0,
  paymentMethod: 'cash',

  addItem: (product: CartItem) => {
    const items = [...get().items];
    const idx = items.findIndex((i) => i.productId === product.productId && i.unit === product.unit);
    if (idx >= 0) {
      items[idx] = {
        ...items[idx],
        quantity: items[idx].quantity + product.quantity,
        total: (items[idx].quantity + product.quantity) * product.price - items[idx].discount,
      };
    } else {
      items.push({
        ...product,
        total: product.quantity * product.price - product.discount,
      });
    }
    set({ items });
    get().calculateTotals();
  },

  removeItem: (productId: string, unit: string) => {
    set({ items: get().items.filter((i) => !(i.productId === productId && i.unit === unit)) });
    get().calculateTotals();
  },

  updateQuantity: (productId: string, unit: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeItem(productId, unit);
      return;
    }
    const items = get().items.map((i) =>
      i.productId === productId && i.unit === unit
        ? { ...i, quantity, total: quantity * i.price - i.discount }
        : i
    );
    set({ items });
    get().calculateTotals();
  },

  updateItemDiscount: (productId: string, unit: string, discount: number) => {
    const items = get().items.map((i) =>
      i.productId === productId && i.unit === unit
        ? { ...i, discount, total: i.quantity * i.price - discount }
        : i
    );
    set({ items });
    get().calculateTotals();
  },

  setCustomer: (customerId: string | null, tierDiscountPercent: number) => {
    set({ customerId, loyaltyDiscountPercent: tierDiscountPercent });
    get().calculateTotals();
  },

  setDiscount: (amount: number, percent?: number) => {
    set({ discount: amount, discountPercent: percent || 0 });
    get().calculateTotals();
  },

  setTax: (percent: number) => {
    set({ taxPercent: percent });
    get().calculateTotals();
  },

  setPayment: (method: PaymentMethod, amount: number) => {
    set({ paymentMethod: method, amountPaid: amount });
    get().calculateTotals();
  },

  calculateTotals: () => {
    const { items, discount, discountPercent, taxPercent, loyaltyDiscountPercent } = get();

    const subtotal = items.reduce((sum, i) => sum + i.quantity * i.price, 0);
    const itemDiscounts = items.reduce((sum, i) => sum + i.discount, 0);
    const totalDiscount = discount + itemDiscounts;

    // Loyalty tier discount applied first to subtotal
    const afterLoyalty = subtotal - (subtotal * (loyaltyDiscountPercent / 100));

    // Then manual percent discount, then fixed discount
    const afterPercent = afterLoyalty - (afterLoyalty * (discountPercent / 100));
    const afterDiscount = afterPercent - discount;

    const tax = Math.round(afterDiscount * (taxPercent / 100));
    const total = afterDiscount + tax;

    set({
      subtotal,
      discount: totalDiscount,
      tax,
      total,
      change: Math.max(0, get().amountPaid - total),
    });
  },

  clearCart: () => {
    set({
      items: [],
      customerId: null,
      loyaltyDiscountPercent: 0,
      subtotal: 0,
      discount: 0,
      discountPercent: 0,
      tax: 0,
      taxPercent: 0,
      total: 0,
      amountPaid: 0,
      change: 0,
      paymentMethod: 'cash',
    });
  },

  holdBill: async (notes?: string) => {
    const { items, customerId, subtotal, discount, discountPercent, tax, taxPercent, total } = get();
    const api = (window as any).api;

    const dto = {
      userId: 'current-user-id', // TODO: get from authStore
      customerId,
      subtotal,
      discount,
      discountPercent,
      tax,
      taxPercent,
      total,
      paymentMethod: 'cash',
      amountPaid: 0,
      change: 0,
      notes: notes || null,
      items: items.map((i) => ({
        productId: i.productId,
        productName: i.productName,
        quantity: i.quantity,
        unit: i.unit,
        price: i.price,
        discount: i.discount,
        total: i.total,
      })),
    };

    const res: any = await api.transactionHold(dto);
    if (res.ok) {
      get().clearCart();
    }
    return res;
  },

  loadHeldBill: (transaction: any) => {
    set({ items: [] });
    if (transaction?.items) {
      for (const item of transaction.items) {
        get().addItem({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unit: item.unit,
          unitConversion: 1,
          price: item.price,
          discount: item.discount,
          total: item.total,
        });
      }
    }
  },

  deleteHeldBill: async (id: string) => {
    const api = (window as any).api;
    await api.transactionVoid(id, 'Dihapus oleh kasir');
  },

  pay: async (overrideUserId?: string, shiftId?: string, payCustomerId?: string) => {
    const { items, customerId, discount, discountPercent, tax, taxPercent, total, amountPaid, paymentMethod } = get();
    const api = (window as any).api;

    if (amountPaid < total) {
      return { ok: false, error: { code: 'TRANS_002', message: 'Jumlah pembayaran kurang' } };
    }

    // Get current user
    let userId = overrideUserId || 'anonymous';
    if (!overrideUserId) {
      try {
        const authUser = (window as any).__authUser;
        if (authUser?.id) userId = authUser.id;
      } catch {
        // ignore
      }
    }

    const dto = {
      userId,
      customerId: payCustomerId ?? customerId,
      subtotal: get().subtotal,
      discount,
      discountPercent,
      tax,
      taxPercent,
      total,
      paymentMethod,
      amountPaid,
      change: amountPaid - total,
      shiftId: shiftId || null,
      items: items.map((i) => ({
        productId: i.productId,
        productName: i.productName,
        quantity: i.quantity,
        unit: i.unit,
        price: i.price,
        discount: i.discount,
        total: i.total,
      })),
    };

    return await api.transactionCreate(dto);
  },
}));
