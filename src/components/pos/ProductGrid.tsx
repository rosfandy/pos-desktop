import { useState, useMemo, useEffect, useCallback } from 'react';
import { useCartStore } from '@/stores/cartStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { MagnifyingGlass, Plus } from 'phosphor-react';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  price: number;       // in rupiah
  category: string;
  barcode?: string;
  stock: number;
  unit?: string;
  unitConversion?: number;
}

// ─── Fallback Mock Products ────────────────────────────────────────────────────

const MOCK_PRODUCTS: Product[] = [
  { id: 'p1', name: 'Kopi Susu Gula Aren', price: 18000, category: 'Minuman', barcode: '899001001', stock: 50 },
  { id: 'p2', name: 'Kopi Hitam', price: 12000, category: 'Minuman', barcode: '899001002', stock: 50 },
  { id: 'p3', name: 'Teh Tarik', price: 15000, category: 'Minuman', barcode: '899001003', stock: 40 },
  { id: 'p4', name: 'Es Jeruk', price: 14000, category: 'Minuman', barcode: '899001004', stock: 30 },
  { id: 'p5', name: 'Roti Bakar Cokelat', price: 22000, category: 'Makanan', barcode: '899002001', stock: 20 },
  { id: 'p6', name: 'Nasi Goreng', price: 25000, category: 'Makanan', barcode: '899002002', stock: 15 },
  { id: 'p7', name: 'Mie Goreng', price: 20000, category: 'Makanan', barcode: '899002003', stock: 25 },
  { id: 'p8', name: 'Ayam Geprek', price: 28000, category: 'Makanan', barcode: '899002004', stock: 10 },
  { id: 'p9', name: 'Air Mineral 600ml', price: 5000, category: 'Minuman', barcode: '899001005', stock: 100 },
  { id: 'p10', name: 'Jus Alpukat', price: 20000, category: 'Minuman', barcode: '899001006', stock: 20 },
  { id: 'p11', name: 'Kentang Goreng', price: 18000, category: 'Makanan', barcode: '899002005', stock: 30 },
  { id: 'p12', name: 'Sosis Bakar', price: 15000, category: 'Makanan', barcode: '899002006', stock: 25 },
  { id: 'p13', name: 'Cappuccino', price: 25000, category: 'Minuman', barcode: '899001007', stock: 40 },
  { id: 'p14', name: 'Latte', price: 28000, category: 'Minuman', barcode: '899001008', stock: 35 },
  { id: 'p15', name: 'Croissant Butter', price: 22000, category: 'Makanan', barcode: '899002007', stock: 15 },
  { id: 'p16', name: 'Cheesecake', price: 35000, category: 'Makanan', barcode: '899002008', stock: 8 },
  { id: 'p17', name: 'Green Tea Latte', price: 24000, category: 'Minuman', barcode: '899001009', stock: 30 },
  { id: 'p18', name: 'Mochaccino', price: 27000, category: 'Minuman', barcode: '899001010', stock: 25 },
  { id: 'p19', name: 'Nasi Padang', price: 30000, category: 'Makanan', barcode: '899002009', stock: 12 },
  { id: 'p20', name: 'Sate Ayam', price: 35000, category: 'Makanan', barcode: '899002010', stock: 10 },
  { id: 'p21', name: 'Gado-Gado', price: 22000, category: 'Makanan', barcode: '899002011', stock: 18 },
  { id: 'p22', name: 'Es Campur', price: 18000, category: 'Minuman', barcode: '899001011', stock: 22 },
  { id: 'p23', name: 'Martabak Manis', price: 32000, category: 'Makanan', barcode: '899002012', stock: 6 },
  { id: 'p24', name: 'Pisang Goreng', price: 12000, category: 'Makanan', barcode: '899002013', stock: 40 },
];

// ─── Component ───────────────────────────────────────────────────────────────

interface ProductGridProps {
  className?: string;
  activeCategory?: string;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export default function ProductGrid({ className, activeCategory: externalCategory, searchQuery: externalSearch, onSearchChange }: ProductGridProps) {
  const [internalSearch, setInternalSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const addItem = useCartStore((s) => s.addItem);

  // Use external or internal state
  const search = externalSearch ?? internalSearch;
  const setSearch = onSearchChange ?? setInternalSearch;
  const activeCategory = externalCategory ?? 'Semua';

  // Load products from API on mount
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res: any = await window.api.productList({});
        if (res.ok && res.data && res.data.data && res.data.data.length > 0) {
          setProducts(res.data.data);
        } else {
          setProducts(MOCK_PRODUCTS);
        }
      } catch {
        setProducts(MOCK_PRODUCTS);
      }
    };
    loadProducts();
  }, []);

  // Barcode scanner handler — if external search is provided, use that
  const handleBarcodeScan = useCallback(async (barcode: string) => {
    // Try to find product by barcode from current products list first
    let product = products.find((p) => p.barcode === barcode);

    // If not found, query API
    if (!product) {
      try {
        const res: any = await window.api.productGetByBarcode(barcode);
        if (res.ok && res.data) {
          product = res.data;
        }
      } catch {
        // ignore
      }
    }

    // If still not found, try searching by ID
    if (!product) {
      product = products.find((p) => p.id === barcode);
    }

    if (product) {
      addItem({
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unit: product.unit || 'pcs',
        unitConversion: product.unitConversion || 1,
        price: Math.round(product.price * 100),
        discount: 0,
        total: Math.round(product.price * 100),
      });
      setSearch(product.name);
    } else {
      setSearch(`❌ ${barcode}`);
      setTimeout(() => setSearch(''), 1500);
    }
  }, [products, addItem, setSearch]);

  // Listen for barcode events from parent
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.barcode) handleBarcodeScan(detail.barcode);
    };
    window.addEventListener('barcode:scan', handler);
    return () => window.removeEventListener('barcode:scan', handler);
  }, [handleBarcodeScan]);

  const filtered = useMemo(() => {
    let list = products;

    // Category filter
    if (activeCategory !== 'Semua') {
      list = list.filter((p) => p.category === activeCategory);
    }

    // Fuzzy search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.barcode?.includes(q)
      );
    }

    return list;
  }, [search, activeCategory, products]);

  const handleAdd = (product: Product) => {
    addItem({
      productId: product.id,
      productName: product.name,
      quantity: 1,
      unit: 'pcs',
      unitConversion: 1,
      price: Math.round(product.price * 100),
      discount: 0,
      total: Math.round(product.price * 100),
    });
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Search + Category */}
      <div className="shrink-0 border-b border-neutral-200 p-2 bg-white">
        <div className="relative mb-2">
          <MagnifyingGlass className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari produk atau scan barcode…"
            className="h-9 pl-9 text-[12px]"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {filtered.map((product) => (
<Button
                key={product.id}
                variant="outline"
                onClick={() => handleAdd(product)}
                className="flex flex-col items-start p-2.5 rounded-lg border-neutral-200 bg-white hover:border-indigo-300 hover:shadow-sm active:scale-[0.98] h-auto w-auto group"
              >
                {/* Image placeholder */}
                <div className="w-full aspect-square rounded-md bg-neutral-100 flex items-center justify-center mb-1.5 overflow-hidden">
                  <span className="text-[28px] opacity-20 group-hover:opacity-40 transition-opacity">
                    📦
                  </span>
                </div>

                {/* Name */}
                <p className="text-[11px] font-medium text-neutral-800 text-left line-clamp-2 w-full leading-snug">
                  {product.name}
                </p>

                {/* Price + Add */}
                <div className="flex items-center justify-between w-full mt-1">
                  <span className="text-[12px] font-bold text-indigo-600">
                    Rp{product.price.toLocaleString('id-ID')}
                  </span>
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                    <Plus weight="bold" className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Button>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-neutral-400 py-20">
            <MagnifyingGlass className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-[12px]">Produk tidak ditemukan</p>
          </div>
        )}
      </div>
    </div>
  );
}
