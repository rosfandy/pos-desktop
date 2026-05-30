import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface POSTerminalProps {
  leftPanel?: ReactNode;    // Categories
  centerPanel?: ReactNode;  // Products grid
  rightPanel?: ReactNode;   // Cart
  className?: string;
}

export default function POSTerminal({ leftPanel, centerPanel, rightPanel, className }: POSTerminalProps) {
  return (
    <div className={cn('flex h-full', className)}>
      {/* Left — Categories */}
      <aside className="w-48 shrink-0 flex flex-col border-r border-neutral-200 bg-white">
        {leftPanel}
      </aside>

      {/* Center — Products */}
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden bg-neutral-50">
        {centerPanel}
      </main>

      {/* Right — Cart */}
      <aside className="w-96 shrink-0 flex flex-col border-l border-neutral-200 bg-white">
        {rightPanel}
      </aside>
    </div>
  );
}
