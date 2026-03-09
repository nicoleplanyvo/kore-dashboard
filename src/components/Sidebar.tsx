import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Building2, Wrench, Store, Shield, Users, GitBranch, LogOut, X } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { hasMinRole, type UserRole } from '../shared/types';
import { api } from '../lib/api';
import t from '../locales/de.json';

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  minRole: UserRole;
}

const navItems: NavItem[] = [
  { to: '/', icon: LayoutDashboard, label: t.nav.dashboard, minRole: 'learner' },
  { to: '/tenants', icon: Building2, label: t.nav.tenants, minRole: 'kore_admin' },
  { to: '/users', icon: Users, label: 'Benutzer', minRole: 'store_manager' },
  { to: '/stores', icon: Store, label: 'Stores', minRole: 'store_manager' },
  { to: '/reporting', icon: GitBranch, label: 'Organisation', minRole: 'regional_manager' },
  { to: '/tools', icon: Wrench, label: t.nav.tools, minRole: 'store_manager' },
  { to: '/gdpr', icon: Shield, label: t.nav.gdpr, minRole: 'tenant_admin' },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user, clearAuth } = useAuthStore();
  const userRole = user?.role || 'learner';

  // Filtere NavItems basierend auf User-Rolle
  const visibleItems = navItems.filter((item) =>
    hasMinRole(userRole, item.minRole),
  );

  const handleLogout = async () => {
    try {
      await api('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignoriere Fehler beim Logout
    }
    clearAuth();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-[240px] bg-kore-ink flex flex-col flex-shrink-0
          transform transition-transform duration-200 ease-in-out
          lg:relative lg:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo + Close on mobile */}
        <div className="px-lg py-xl border-b border-white/10 flex items-center justify-between">
          <div>
            <h1 className="font-display text-h3 text-kore-white tracking-wider">KORE</h1>
            <p className="font-body text-[0.65rem] text-kore-faint uppercase tracking-[0.16em] mt-xs">
              {userRole === 'kore_admin' ? 'Admin Dashboard' : 'Dashboard'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-kore-faint hover:text-kore-white transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-lg px-md-sm overflow-y-auto">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-md-sm px-md py-md-sm rounded-sm mb-xs transition-colors duration-200 ${
                  isActive
                    ? 'bg-white/10 text-kore-brass-lt'
                    : 'text-kore-faint hover:text-kore-white hover:bg-white/5'
                }`
              }
            >
              <item.icon size={18} />
              <span className="font-body text-small font-normal">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Info + Logout */}
        <div className="px-md-sm py-lg border-t border-white/10">
          {user && (
            <div className="px-md mb-md">
              <p className="font-body text-[0.7rem] text-kore-faint truncate">{user.name}</p>
              <p className="font-body text-[0.6rem] text-kore-faint/60 truncate">{user.email}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-md-sm px-md py-md-sm text-kore-faint hover:text-kore-error transition-colors duration-200 w-full font-body text-small"
          >
            <LogOut size={18} />
            <span>{t.nav.logout}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
