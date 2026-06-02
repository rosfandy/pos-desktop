import * as React from 'react';
import { CaretDown, CaretUp } from 'phosphor-react';
import { cn } from '@/lib/utils';

export function PosTableSection({ title, className, headerClassName, bodyClassName, children }: React.ComponentProps<'div'> & { title: string; headerClassName?: string; bodyClassName?: string }) {
  return (
    <div className={cn('bg-white border border-neutral-300 shadow-sm overflow-hidden', className)}>
      <div className={cn('h-9 flex items-center px-3 border-b border-neutral-200 bg-neutral-50', headerClassName)}>
        <span className="text-[11px] font-semibold text-neutral-700 uppercase tracking-wide">{title}</span>
      </div>
      <div className={cn('overflow-x-auto', bodyClassName)}>{children}</div>
    </div>
  );
}

export function PosTableContainer({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('overflow-auto', className)} {...props} />;
}

export function PosTable({ className, ...props }: React.ComponentProps<'table'>) {
  return <table className={cn('pos-table', className)} {...props} />;
}

export function PosTableHead({ className, ...props }: React.ComponentProps<'thead'>) {
  return <thead className={cn('pos-table-thead', className)} {...props} />;
}

export function PosTableHeaderCell({ className, sortable, ...props }: React.ComponentProps<'th'> & { sortable?: boolean }) {
  return <th className={cn('pos-table-th', sortable && 'cursor-pointer hover:text-neutral-700 select-none', className)} {...props} />;
}

export function PosTableRow({ active, className, ...props }: React.ComponentProps<'tr'> & { active?: boolean }) {
  return <tr className={cn(active ? 'pos-table-tr-active' : 'pos-table-tr', className)} {...props} />;
}

export function PosTableCell({ className, ...props }: React.ComponentProps<'td'>) {
  return <td className={cn('pos-table-td', className)} {...props} />;
}

export function PosTableEmptyRow({
  colSpan,
  children,
  className,
  ...props
}: React.ComponentProps<'td'> & { colSpan: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className={cn('px-3 py-8 text-center text-[11px] text-neutral-400 border-b border-neutral-100', className)} {...props}>
        {children}
      </td>
    </tr>
  );
}

export function PosSortIcon({ active, direction }: { active?: boolean; direction?: 'asc' | 'desc' }) {
  if (!active) return null;
  return direction === 'asc' ? <CaretUp className="w-3 h-3" /> : <CaretDown className="w-3 h-3" />;
}
