import {
  House,
  Storefront,
  Package,
  Cube,
  Users,
  ChartBar,
  Clock,
} from 'phosphor-react';

export const NAV_ITEMS = [
  { to: '/',          label: 'Dashboard',  icon: House },
  { to: '/pos',       label: 'Kasir',      icon: Storefront },
  { to: '/products',  label: 'Produk',     icon: Package },
  { to: '/inventory', label: 'Inventaris', icon: Cube },
  { to: '/customers', label: 'Pelanggan',  icon: Users },
  { to: '/reports',   label: 'Laporan',    icon: ChartBar },
  { to: '/shifts',    label: 'Shift',      icon: Clock },
];
