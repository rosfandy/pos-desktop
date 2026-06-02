import * as React from 'react';
import {
  PosTableContainer,
  PosTable,
  PosTableHead,
  PosTableHeaderCell,
  PosTableRow,
  PosTableCell,
  PosTableEmptyRow,
  PosSortIcon,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

export interface DataTableColumn<T> {
  key: string;
  header: React.ReactNode;
  headerClassName?: string;
  cellClassName?: string;
  sortable?: boolean;
  onHeaderClick?: () => void;
  render: (item: T, index: number) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  emptyMessage?: React.ReactNode;
  emptyColSpan?: number;
  containerClassName?: string;
  tableClassName?: string;
  rowClassName?: string | ((item: T, index: number) => string | undefined);
  getRowKey: (item: T, index: number) => string;
  onRowClick?: (item: T, index: number) => void;
  activeRow?: (item: T, index: number) => boolean;
}

export function DataTable<T>({
  data,
  columns,
  emptyMessage = 'Belum ada data',
  emptyColSpan,
  containerClassName,
  tableClassName,
  rowClassName,
  getRowKey,
  onRowClick,
  activeRow,
}: DataTableProps<T>) {
  return (
    <PosTableContainer className={containerClassName}>
      <PosTable className={tableClassName}>
        <PosTableHead>
          <tr>
            {columns.map((column) => (
              <PosTableHeaderCell
                key={column.key}
                className={column.headerClassName}
                sortable={column.sortable}
                onClick={column.onHeaderClick}
              >
                {column.header}
              </PosTableHeaderCell>
            ))}
          </tr>
        </PosTableHead>
        <tbody>
          {data.length === 0 ? (
            <PosTableEmptyRow colSpan={emptyColSpan ?? columns.length}>{emptyMessage}</PosTableEmptyRow>
          ) : (
            data.map((item, index) => {
              const resolvedRowClassName = typeof rowClassName === 'function' ? rowClassName(item, index) : rowClassName;

              return (
                <PosTableRow
                  key={getRowKey(item, index)}
                  active={activeRow?.(item, index)}
                  className={cn(onRowClick && 'cursor-pointer', resolvedRowClassName)}
                  onClick={onRowClick ? () => onRowClick(item, index) : undefined}
                >
                  {columns.map((column) => (
                    <PosTableCell key={column.key} className={column.cellClassName}>
                      {column.render(item, index)}
                    </PosTableCell>
                  ))}
                </PosTableRow>
              );
            })
          )}
        </tbody>
      </PosTable>
    </PosTableContainer>
  );
}

export { PosSortIcon };
