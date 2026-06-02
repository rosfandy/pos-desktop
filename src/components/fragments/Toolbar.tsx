import { useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { House, Gear, CaretRight, TextIndent } from 'phosphor-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { NAV_ITEMS } from './navConfig';

interface ToolbarProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

function LiveClock() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="text-[11px] text-muted-foreground tabular-nums font-mono">
      {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  );
}

export default function Toolbar({ sidebarCollapsed, onToggleSidebar }: ToolbarProps) {
  const location = useLocation();
  const allNav = [...NAV_ITEMS, { to: '/settings', label: 'Pengaturan', icon: Gear }];
  const current = allNav.find((n) =>
    n.to === '/' ? location.pathname === '/' : location.pathname.startsWith(n.to)
  );
  const segments = location.pathname.split('/').filter(Boolean);

  return (
    <div className="h-9 shrink-0 flex items-center px-3 gap-3 bg-card text-card-foreground border-b border-border select-none">
      {/* Sidebar toggle */}
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={onToggleSidebar}
        className="text-muted-foreground hover:text-foreground hover:bg-muted -ml-1"
        title={sidebarCollapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
      >
        <TextIndent className={cn('w-3.5 h-3.5 transition-transform duration-200', sidebarCollapsed && 'rotate-180')} />
      </Button>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
        <House className="w-3 h-3" />
        {segments.length === 0 ? (
          <span className="text-foreground font-medium">Dashboard</span>
        ) : (
          <>
            <CaretRight className="w-2.5 h-2.5" />
            <span className="text-foreground font-medium">{current?.label}</span>
          </>
        )}
      </div>

      <div className="flex-1" />

      <LiveClock />
    </div>
  );
}
