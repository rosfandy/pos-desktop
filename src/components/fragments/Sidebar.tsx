import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Storefront, Gear, User, SignOut } from 'phosphor-react';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { NAV_ITEMS } from './navConfig';

interface SidebarProps {
  collapsed: boolean;
}

export default function Sidebar({ collapsed }: SidebarProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const location = useLocation();

  return (
    <aside
      className={cn(
        'shrink-0 flex flex-col bg-neutral-900 text-neutral-100 select-none transition-all duration-200 ease-in-out',
        collapsed ? 'w-14' : 'w-48'
      )}
    >
      {/* App brand */}
      <div className={cn('h-9 flex items-center bg-neutral-950 border-b border-white/30!', collapsed ? 'justify-center px-0' : 'gap-2 px-3')}>
        <div className="w-5 h-5 rounded bg-indigo-500 flex items-center justify-center shrink-0">
          <Storefront weight="fill" className="w-3 h-3 text-white" />
        </div>
        {!collapsed && <span className="text-[12px] font-semibold tracking-wide text-white">POS Desktop</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-1">
        <div className={collapsed ? 'px-0' : 'px-2 py-1.5'}>
          {!collapsed && <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500 px-2 mb-1">Menu</p>}
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
            const isActive = to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(to);
            return (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={cn(
                  'flex items-center rounded text-[12px] font-medium transition-colors mb-0.5',
                  collapsed
                    ? 'justify-center mx-1.5 py-2'
                    : 'gap-2.5 px-2 py-1.5',
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100'
                )}
                title={collapsed ? label : undefined}
              >
                <Icon weight={isActive ? 'fill' : 'regular'} className="w-4 h-4 shrink-0" />
                {!collapsed && label}
              </NavLink>
            );
          })}
        </div>

        <div className={cn(collapsed ? 'px-0' : 'px-2 py-1.5', 'mt-1 border-t border-white/30!')}>
          {!collapsed && <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500 px-2 mb-1">Sistem</p>}
          <NavLink
            to="/settings"
            className={({ isActive }) => cn(
              'flex items-center rounded text-[12px] font-medium transition-colors',
              collapsed
                ? 'justify-center mx-1.5 py-2'
                : 'gap-2.5 px-2 py-1.5',
              isActive
                ? 'bg-indigo-600 text-white'
                : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100'
            )}
            title={collapsed ? 'Pengaturan' : undefined}
          >
            {({ isActive }) => (
              <>
                <Gear weight={isActive ? 'fill' : 'regular'} className="w-4 h-4 shrink-0" />
                {!collapsed && 'Pengaturan'}
              </>
            )}
          </NavLink>
        </div>
      </nav>

      {/* User info */}
      <div className={cn('border-t border-white/30! flex items-center', collapsed ? 'justify-center gap-1 py-2' : 'gap-2 px-3 py-2')}>
        <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center shrink-0" title={user?.name ?? 'Pengguna'}>
          <User weight="fill" className="w-3 h-3 text-white" />
        </div>
        {!collapsed && (
          <>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-neutral-100 truncate leading-tight">{user?.name ?? 'Pengguna'}</p>
              <p className="text-[10px] text-neutral-500 capitalize truncate leading-tight">{user?.role ?? 'kasir'}</p>
            </div>
            <Button
              size="icon-xs"
              onClick={() => { logout(); navigate('/login'); }}
              className="bg-red-900/70 text-red-500 hover:text-red-400 hover:bg-red-800 border-red-700!"
              title="Keluar"
            >
              <SignOut className="w-3.5 h-3.5" />
            </Button>
          </>
        )}
        {collapsed && (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => { logout(); navigate('/login'); }}
            className="text-neutral-500 hover:text-red-400 hover:bg-neutral-800"
            title="Keluar"
          >
            <SignOut className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </aside>
  );
}
