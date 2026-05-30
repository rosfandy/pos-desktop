'use client';

import { useProductStore } from '@/stores/productStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PencilSimple, Trash, WarningCircle, Package } from 'phosphor-react';

export interface ProductCardProps {
  productId: string;
  onEdit?: (productId: string) => void;
  onDelete?: (productId: string) => void;
  onClick?: (productId: string) => void;
  className?: string;
}

export default function ProductCard({ productId, onEdit, onDelete, onClick, className }: ProductCardProps) {
  const { products } = useProductStore();
  const product = products.find((p) => p.id === productId);

  if (!product) return null;

  const isLow = product.stock <= product.minStock;
  const price = product.priceSell / 100;

  return (
    <div
      onClick={() => onClick?.(product.id)}
      className={cn(
        'group relative flex flex-col bg-white rounded-lg border border-neutral-200 p-3 transition-all cursor-pointer',
        'hover:shadow-md hover:border-indigo-200',
        className
      )}
    >
      {/* Image placeholder */}
      <div className="aspect-square bg-neutral-100 rounded-md mb-2 flex items-center justify-center overflow-hidden">
        {product.imagePath ? (
          <img src={product.imagePath} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <Package className="w-10 h-10 text-neutral-300" />
        )}
      </div>

      {/* Badge low stock */}
      {isLow && (
        <span className="absolute top-2 right-2 flex items-center gap-0.5 bg-red-50 text-red-600 text-[10px] font-medium px-1.5 py-0.5 rounded-full">
          <WarningCircle className="w-3 h-3" />
          Low
        </span>
      )}

      {/* Name */}
      <p className="text-[12px] font-medium text-neutral-800 truncate leading-tight">{product.name}</p>

      {/* Category */}
      <p className="text-[10px] text-neutral-400 mt-0.5 truncate">{product.categoryName || product.categoryId || 'Tanpa Kategori'}</p>

      {/* SKU */}
      {product.sku && <p className="text-[10px] text-neutral-400 font-mono truncate">SKU: {product.sku}</p>}

      {/* Price */}
      <p className="text-[13px] font-bold text-indigo-600 mt-1">Rp{price.toLocaleString('id-ID')}</p>

      {/* Stock */}
      <p className={cn('text-[11px] tabular-nums', isLow ? 'text-red-500 font-semibold' : 'text-neutral-500')}>
        Stok: {product.stock} {product.baseUnit}
      </p>

      {/* Action buttons */}
      <div className="flex items-center gap-1 mt-2 pt-2 border-t border-neutral-100 opacity-0 group-hover:opacity-100 transition-opacity">
        {onEdit && (
          <Button
            variant="ghost"
            size="xs"
            onClick={(e) => { e.stopPropagation(); onEdit(product.id); }}
            className="flex-1 flex items-center justify-center gap-1 text-[10px] text-amber-600 hover:bg-amber-50"
          >
            <PencilSimple className="w-3 h-3" />
            Edit
          </Button>
        )}
        {onDelete && (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={(e) => { e.stopPropagation(); onDelete(product.id); }}
            className="text-red-500 hover:bg-red-50"
            title="Hapus"
          >
            <Trash className="w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
