import { User, Menu, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { api } from '../lib/api';
import type { AuthUser } from '../shared/types';

const ROLE_LABELS: Record<string, string> = {
  kore_admin: 'Super Admin',
  tenant_admin: 'Kunden-Admin',
  regional_manager: 'Regional Manager',
  multisite_manager: 'Multisite Manager',
  store_manager: 'Store Manager',
  learner: 'Mitarbeiter',
};

interface TopBarProps {
  onMenuToggle: () => void;
}

export function TopBar({ onMenuToggle }: TopBarProps) {
  const { user, setAuth } = useAuthStore();

  const handleStopImpersonation = async () => {
    try {
      const res = await api<{ accessToken: string; user: AuthUser }>(
        '/api/auth/stop-impersonation',
        { method: 'POST' },
      );
      setAuth(res.user, res.accessToken);
    } catch (err) {
      console.error('Stop impersonation error:', err);
    }
  };

  return (
    <>
      {/* Impersonation Banner */}
      {user?.impersonatedBy && (
        <div className="bg-amber-400 text-amber-900 px-md sm:px-xl py-sm flex items-center justify-between text-sm font-body">
          <span>
            Angemeldet als <strong>{user.name}</strong> ({ROLE_LABELS[user.role] || user.role})
          </span>
          <button
            onClick={handleStopImpersonation}
            className="flex items-center gap-xs px-md py-xs bg-amber-600 text-white rounded-sm hover:bg-amber-700 transition-colors text-xs font-medium"
          >
            <ArrowLeft size={14} />
            Zurück zum Admin
          </button>
        </div>
      )}

      {/* TopBar */}
      <header className="h-[56px] bg-kore-white border-b border-kore-border flex items-center justify-between px-md sm:px-xl flex-shrink-0">
        <button
          onClick={onMenuToggle}
          className="lg:hidden w-[36px] h-[36px] flex items-center justify-center rounded-sm hover:bg-kore-surface transition-colors"
          aria-label="Menü öffnen"
        >
          <Menu size={20} className="text-kore-ink" />
        </button>

        {/* Spacer for desktop (no hamburger) */}
        <div className="hidden lg:block" />

        <div className="flex items-center gap-md-sm">
          <span className="font-body text-caption text-kore-mid hidden sm:inline">
            {ROLE_LABELS[user?.role || ''] || ''}
          </span>
          <div className="w-[32px] h-[32px] rounded-full bg-kore-surface flex items-center justify-center">
            <User size={16} className="text-kore-mid" />
          </div>
          <span className="font-body text-small text-kore-ink hidden sm:inline">{user?.name}</span>
        </div>
      </header>
    </>
  );
}
