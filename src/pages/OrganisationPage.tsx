import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  GitBranch, Users, Store, MapPin, ChevronDown, ChevronRight,
  Plus, Pencil, Trash2, Check, X, FolderTree, Wrench,
} from 'lucide-react';
import { useReportingHierarchy } from '../hooks/useReporting';
import { useRegions, useCreateRegion, useUpdateRegion, useDeleteRegion } from '../hooks/useRegions';
import { useTenants } from '../hooks/useTenants';
import { useStores } from '../hooks/useStores';
import { useAuthStore } from '../stores/authStore';
import { api } from '../lib/api';
import { useQueryClient } from '@tanstack/react-query';
import type { UserRole, ReportingManager, ReportingStore, ReportingRegion } from '../shared/types';

const ROLE_LABELS: Record<string, string> = {
  tenant_admin: 'Kunden-Admin',
  regional_manager: 'Regional Manager',
  multisite_manager: 'Multisite Manager',
  store_manager: 'Store Manager',
  learner: 'Mitarbeiter',
};

const ROLE_COLORS: Record<string, string> = {
  tenant_admin: 'bg-blue-100 text-blue-800',
  regional_manager: 'bg-amber-100 text-amber-800',
  multisite_manager: 'bg-teal-100 text-teal-800',
  store_manager: 'bg-green-100 text-green-800',
  learner: 'bg-gray-100 text-gray-700',
};

const ROLE_ORDER: UserRole[] = [
  'tenant_admin', 'regional_manager', 'multisite_manager', 'store_manager', 'learner',
];

type ViewMode = 'tree' | 'manager' | 'store';

export function OrganisationPage() {
  const user = useAuthStore((s) => s.user);
  const isKoreAdmin = user?.role === 'kore_admin';
  const isTenantAdmin = user?.role === 'tenant_admin' || isKoreAdmin;

  const { data: tenants } = useTenants(isKoreAdmin ? {} : undefined);
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('tree');

  const effectiveTenantId = isKoreAdmin ? selectedTenantId : user?.tenantId;
  const { data: hierarchy, isLoading } = useReportingHierarchy(effectiveTenantId || undefined);

  const tenantList = tenants?.data || [];
  if (isKoreAdmin && !selectedTenantId && tenantList.length > 0) {
    setSelectedTenantId(tenantList[0]!.id);
  }

  // Manager nach Rolle gruppieren
  const managersByRole: Record<string, ReportingManager[]> = {};
  if (hierarchy?.managers) {
    for (const mgr of hierarchy.managers) {
      if (!managersByRole[mgr.role]) managersByRole[mgr.role] = [];
      managersByRole[mgr.role]!.push(mgr);
    }
  }

  const totalStores = (hierarchy?.regions?.reduce((sum, r) => sum + r.stores.length, 0) ?? 0) + (hierarchy?.stores?.length ?? 0);
  const totalUsers = hierarchy?.managers?.length ?? 0;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-md mb-lg sm:mb-xl">
        <div className="flex items-center gap-md">
          <div className="w-10 h-10 rounded-lg bg-sand-50 flex items-center justify-center flex-shrink-0">
            <GitBranch className="w-5 h-5 text-kore-brass" />
          </div>
          <h1 className="font-display text-h2 sm:text-h1 text-kore-ink">Organisationsstruktur</h1>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-md mb-xl">
        {isKoreAdmin && (
          <select
            value={selectedTenantId}
            onChange={(e) => setSelectedTenantId(e.target.value)}
            className="px-md py-sm border border-kore-border font-body text-body text-kore-ink bg-kore-white focus:outline-none focus:border-kore-brass"
          >
            <option value="">Kunde wählen...</option>
            {tenantList.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        )}

        <div className="flex border border-kore-border bg-kore-white">
          {(['tree', 'manager', 'store'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`flex items-center gap-xs px-md py-sm font-body text-small transition-colors ${
                viewMode === mode ? 'bg-kore-brass text-kore-white' : 'text-kore-mid hover:text-kore-ink'
              }`}
            >
              {mode === 'tree' && <FolderTree size={14} />}
              {mode === 'manager' && <Users size={14} />}
              {mode === 'store' && <Store size={14} />}
              {mode === 'tree' ? 'Regionen' : mode === 'manager' ? 'Manager' : 'Stores'}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <p className="text-kore-mid font-body">Lade Organisationsstruktur...</p>}

      {isKoreAdmin && !selectedTenantId && !isLoading && (
        <div className="bg-kore-white border border-kore-border p-xl text-center">
          <p className="font-body text-body text-kore-mid">
            Bitte wählen Sie einen Kunden aus, um die Organisationsstruktur anzuzeigen.
          </p>
        </div>
      )}

      {hierarchy && !isLoading && (
        <>
          {/* Tenant Header */}
          <div className="bg-kore-white border border-kore-border px-md sm:px-xl py-md mb-lg">
            <p className="font-body text-caption text-kore-mid uppercase tracking-[0.14em]">Kunde</p>
            <p className="font-display text-h3 text-kore-ink">{hierarchy.tenant.name}</p>
            <p className="font-body text-small text-kore-mid mt-xs">
              {hierarchy.regions?.length ?? 0} Regionen · {totalStores} Stores · {totalUsers} Benutzer
            </p>
          </div>

          {viewMode === 'tree' && (
            <TreeView
              hierarchy={hierarchy}
              tenantId={effectiveTenantId!}
              canEdit={isTenantAdmin}
            />
          )}

          {viewMode === 'manager' && (
            <ManagerView managersByRole={managersByRole} />
          )}

          {viewMode === 'store' && (
            <StoreView
              regions={hierarchy.regions || []}
              unassignedStores={hierarchy.stores || []}
            />
          )}
        </>
      )}
    </div>
  );
}

// ─── Tree View: Regionen → Stores ────────────────────────

function TreeView({ hierarchy, tenantId, canEdit }: {
  hierarchy: { regions?: ReportingRegion[]; stores?: ReportingStore[] };
  tenantId: string;
  canEdit: boolean;
}) {
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set());
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRegionName, setNewRegionName] = useState('');
  const createRegion = useCreateRegion();

  const toggleRegion = (id: string) => {
    setExpandedRegions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreate = () => {
    if (!newRegionName.trim()) return;
    createRegion.mutate(
      { tenantId, name: newRegionName.trim() },
      {
        onSuccess: () => {
          setNewRegionName('');
          setShowCreateForm(false);
        },
      },
    );
  };

  const regions = hierarchy.regions || [];
  const unassigned = hierarchy.stores || [];

  return (
    <div className="flex flex-col gap-md">
      {/* Regionen */}
      {regions.map((region) => (
        <RegionCard
          key={region.id}
          region={region}
          expanded={expandedRegions.has(region.id)}
          onToggle={() => toggleRegion(region.id)}
          canEdit={canEdit}
          tenantId={tenantId}
        />
      ))}

      {/* Nicht zugeordnete Stores */}
      {unassigned.length > 0 && (
        <div className="bg-kore-white border border-kore-border border-dashed">
          <div className="px-md sm:px-xl py-md border-b border-kore-border border-dashed">
            <div className="flex items-center gap-sm">
              <Store size={16} className="text-kore-mid" />
              <span className="font-body text-body text-kore-mid font-medium">
                Nicht zugeordnet
              </span>
              <span className="font-body text-small text-kore-mid">
                ({unassigned.length} Stores)
              </span>
            </div>
          </div>
          <div className="divide-y divide-kore-border">
            {unassigned.map((store) => (
              <StoreRow key={store.id} store={store} />
            ))}
          </div>
        </div>
      )}

      {/* Region erstellen */}
      {canEdit && (
        <div className="mt-sm">
          {showCreateForm ? (
            <div className="flex items-center gap-sm bg-kore-white border border-kore-border px-md py-md">
              <input
                type="text"
                value={newRegionName}
                onChange={(e) => setNewRegionName(e.target.value)}
                placeholder="Regionname..."
                className="flex-1 px-md py-sm border border-kore-border font-body text-body text-kore-ink bg-kore-surface focus:outline-none focus:border-kore-brass"
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                autoFocus
              />
              <button
                onClick={handleCreate}
                disabled={createRegion.isPending || !newRegionName.trim()}
                className="p-sm text-kore-brass hover:text-kore-brass-dk transition-colors disabled:opacity-50"
              >
                <Check size={18} />
              </button>
              <button
                onClick={() => { setShowCreateForm(false); setNewRegionName(''); }}
                className="p-sm text-kore-mid hover:text-kore-ink transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-sm px-md py-md font-body text-small text-kore-brass hover:text-kore-brass-dk transition-colors"
            >
              <Plus size={16} />
              Region hinzufügen
            </button>
          )}
        </div>
      )}

      {regions.length === 0 && unassigned.length === 0 && (
        <div className="bg-kore-white border border-kore-border p-xl text-center">
          <p className="font-body text-body text-kore-mid">
            Noch keine Stores oder Regionen angelegt.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Region Card ──────────────────────────────────────────

function RegionCard({ region, expanded, onToggle, canEdit, tenantId }: {
  region: ReportingRegion;
  expanded: boolean;
  onToggle: () => void;
  canEdit: boolean;
  tenantId: string;
}) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(region.name);
  const [showStoreAssign, setShowStoreAssign] = useState(false);
  const updateRegion = useUpdateRegion(region.id);
  const deleteRegion = useDeleteRegion(region.id);
  const qc = useQueryClient();

  const handleSave = () => {
    if (!editName.trim()) return;
    updateRegion.mutate(
      { name: editName.trim() },
      { onSuccess: () => setEditing(false) },
    );
  };

  const handleDelete = () => {
    if (!confirm(`Region "${region.name}" wirklich löschen? Stores werden nicht gelöscht, nur aus der Region entfernt.`)) return;
    deleteRegion.mutate();
  };

  const totalUsers = region.stores.reduce((sum, s) => s.users.length, 0);

  return (
    <div className="bg-kore-white border border-kore-border">
      {/* Region Header */}
      <div
        className="px-md sm:px-xl py-md flex items-center gap-md cursor-pointer hover:bg-kore-surface/50 transition-colors"
        onClick={onToggle}
      >
        <button className="text-kore-mid flex-shrink-0">
          {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </button>

        {editing ? (
          <div className="flex items-center gap-sm flex-1" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="flex-1 px-md py-xs border border-kore-border font-body text-body text-kore-ink bg-kore-surface focus:outline-none focus:border-kore-brass"
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false); }}
              autoFocus
            />
            <button onClick={handleSave} className="p-xs text-kore-brass hover:text-kore-brass-dk">
              <Check size={16} />
            </button>
            <button onClick={() => setEditing(false)} className="p-xs text-kore-mid hover:text-kore-ink">
              <X size={16} />
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-sm">
                <FolderTree size={16} className="text-kore-brass flex-shrink-0" />
                <span className="font-display text-h3 text-kore-ink truncate">{region.name}</span>
              </div>
              {region.description && (
                <p className="font-body text-small text-kore-mid mt-xs ml-6">{region.description}</p>
              )}
            </div>
            <span className="font-body text-small text-kore-mid flex-shrink-0">
              {region.stores.length} Stores · {totalUsers} Benutzer
            </span>
            {canEdit && (
              <div className="flex items-center gap-xs flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => { setEditing(true); setEditName(region.name); }} className="p-xs text-kore-mid hover:text-kore-brass transition-colors">
                  <Pencil size={14} />
                </button>
                <button onClick={handleDelete} className="p-xs text-kore-mid hover:text-kore-error transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Expanded: Stores */}
      {expanded && (
        <div className="border-t border-kore-border">
          {region.stores.length > 0 ? (
            <div className="divide-y divide-kore-border">
              {region.stores.map((store) => (
                <StoreRow key={store.id} store={store} />
              ))}
            </div>
          ) : (
            <div className="px-md sm:px-xl py-md">
              <p className="font-body text-small text-kore-mid italic ml-6">
                Keine Stores in dieser Region
              </p>
            </div>
          )}

          {canEdit && (
            <div className="px-md sm:px-xl py-sm border-t border-kore-border bg-kore-surface/30">
              {showStoreAssign ? (
                <StoreAssigner
                  regionId={region.id}
                  tenantId={tenantId}
                  currentStoreIds={region.stores.map((s) => s.id)}
                  onClose={() => setShowStoreAssign(false)}
                />
              ) : (
                <button
                  onClick={() => setShowStoreAssign(true)}
                  className="flex items-center gap-xs font-body text-small text-kore-brass hover:text-kore-brass-dk transition-colors py-xs"
                >
                  <Plus size={14} />
                  Stores zuweisen
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Store Assigner ──────────────────────────────────────

function StoreAssigner({ regionId, tenantId, currentStoreIds, onClose }: {
  regionId: string;
  tenantId: string;
  currentStoreIds: string[];
  onClose: () => void;
}) {
  const { data: allStores } = useStores(tenantId);
  const qc = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(currentStoreIds));
  const [saving, setSaving] = useState(false);

  // Alle aktiven Stores des Tenants
  const available = (allStores || []).filter((s) => s.isActive);

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api(`/api/admin/regions/${regionId}/stores`, {
        method: 'PUT',
        body: JSON.stringify({ storeIds: Array.from(selectedIds) }),
      });
      qc.invalidateQueries({ queryKey: ['regions'] });
      qc.invalidateQueries({ queryKey: ['stores'] });
      qc.invalidateQueries({ queryKey: ['reporting'] });
      onClose();
    } catch (err) {
      console.error('Store assign error:', err);
    }
    setSaving(false);
  };

  return (
    <div className="py-sm">
      <p className="font-body text-small text-kore-mid mb-sm">Stores auswählen:</p>
      <div className="flex flex-wrap gap-sm mb-md max-h-40 overflow-y-auto">
        {available.map((store) => (
          <label key={store.id} className="flex items-center gap-xs cursor-pointer">
            <input
              type="checkbox"
              checked={selectedIds.has(store.id)}
              onChange={() => toggle(store.id)}
              className="accent-kore-brass"
            />
            <span className="font-body text-small text-kore-ink">
              {store.name}{store.city ? ` (${store.city})` : ''}
            </span>
          </label>
        ))}
      </div>
      <div className="flex gap-sm">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-md py-xs bg-kore-brass text-kore-white font-body text-small hover:bg-kore-brass-dk transition-colors disabled:opacity-50"
        >
          {saving ? 'Speichern...' : 'Speichern'}
        </button>
        <button
          onClick={onClose}
          className="px-md py-xs font-body text-small text-kore-mid hover:text-kore-ink transition-colors"
        >
          Abbrechen
        </button>
      </div>
    </div>
  );
}

// ─── Store Row ───────────────────────────────────────────

function StoreRow({ store }: { store: ReportingStore }) {
  return (
    <div className="px-md sm:px-xl py-md flex items-center justify-between">
      <div className="flex items-center gap-md min-w-0">
        <div className="ml-6 flex items-center gap-sm min-w-0">
          <Store size={14} className="text-kore-mid flex-shrink-0" />
          <Link
            to={`/stores/${store.id}`}
            className="font-body text-body text-kore-ink hover:text-kore-brass transition-colors truncate"
          >
            {store.name}
          </Link>
          {store.city && (
            <span className="flex items-center gap-0.5 font-body text-small text-kore-mid flex-shrink-0">
              <MapPin size={10} />
              {store.city}
            </span>
          )}
        </div>
      </div>
      <span className="font-body text-small text-kore-mid flex-shrink-0">
        {store.users.length} Benutzer
      </span>
    </div>
  );
}

// ─── Manager View (bestehend) ────────────────────────────

function ManagerView({ managersByRole }: { managersByRole: Record<string, ReportingManager[]> }) {
  return (
    <div className="flex flex-col gap-lg">
      {ROLE_ORDER.map((role) => {
        const mgrs = managersByRole[role];
        if (!mgrs || mgrs.length === 0) return null;
        return (
          <div key={role} className="bg-kore-white border border-kore-border">
            <div className="px-md sm:px-xl py-md border-b border-kore-border">
              <div className="flex items-center gap-sm">
                <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ${ROLE_COLORS[role] || ''}`}>
                  {ROLE_LABELS[role] || role}
                </span>
                <span className="font-body text-small text-kore-mid">({mgrs.length})</span>
              </div>
            </div>
            <div className="divide-y divide-kore-border">
              {mgrs.map((mgr) => (
                <div key={mgr.id} className="px-md sm:px-xl py-md">
                  <div className="flex items-center justify-between mb-sm">
                    <Link to={`/users/${mgr.id}`} className="font-body text-body text-kore-ink font-medium hover:text-kore-brass transition-colors">
                      {mgr.name}
                    </Link>
                    <span className="font-body text-small text-kore-mid">{mgr.email}</span>
                  </div>
                  {mgr.stores.length > 0 ? (
                    <div className="flex flex-wrap gap-sm">
                      {mgr.stores.map((s) => (
                        <Link key={s.id} to={`/stores/${s.id}`} className="inline-flex items-center gap-xs px-md py-xs bg-kore-surface border border-kore-border text-kore-ink font-body text-small hover:border-kore-brass transition-colors">
                          <Store size={12} className="text-kore-mid" />
                          {s.name}
                          {s.city && <span className="text-kore-mid flex items-center gap-0.5"><MapPin size={10} />{s.city}</span>}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="font-body text-small text-kore-mid italic">Keine Stores zugewiesen</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
      {Object.keys(managersByRole).length === 0 && (
        <div className="bg-kore-white border border-kore-border p-xl text-center">
          <p className="font-body text-body text-kore-mid">Keine Benutzer mit Store-Zuweisungen gefunden.</p>
        </div>
      )}
    </div>
  );
}

// ─── Store View (erweitert mit Regionen) ─────────────────

function StoreView({ regions, unassignedStores }: { regions: ReportingRegion[]; unassignedStores: ReportingStore[] }) {
  const allStores = [
    ...regions.flatMap((r) => r.stores.map((s) => ({ ...s, regionName: r.name }))),
    ...unassignedStores.map((s) => ({ ...s, regionName: null as string | null })),
  ];

  return (
    <div className="flex flex-col gap-lg">
      {allStores.map((store) => (
        <div key={store.id} className="bg-kore-white border border-kore-border">
          <div className="px-md sm:px-xl py-md border-b border-kore-border flex items-center justify-between">
            <div className="flex items-center gap-md">
              <Link to={`/stores/${store.id}`} className="font-display text-h3 text-kore-ink hover:text-kore-brass transition-colors">
                {store.name}
              </Link>
              {store.city && (
                <span className="flex items-center gap-xs font-body text-small text-kore-mid">
                  <MapPin size={12} />{store.city}
                </span>
              )}
              {store.regionName && (
                <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-kore-surface text-kore-mid border border-kore-border">
                  <FolderTree size={10} className="mr-1" />
                  {store.regionName}
                </span>
              )}
            </div>
            <span className="font-body text-small text-kore-mid">{store.users.length} Benutzer</span>
          </div>

          {store.users.length > 0 ? (
            <div className="px-md sm:px-xl py-md">
              <div className="flex flex-col gap-xs">
                {ROLE_ORDER.map((role) => {
                  const usersForRole = store.users.filter((u) => u.role === role);
                  if (usersForRole.length === 0) return null;
                  return usersForRole.map((u) => (
                    <div key={u.id} className="flex items-center gap-md py-xs">
                      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full min-w-[120px] justify-center ${ROLE_COLORS[u.role] || ''}`}>
                        {ROLE_LABELS[u.role] || u.role}
                      </span>
                      <Link to={`/users/${u.id}`} className="font-body text-body text-kore-ink hover:text-kore-brass transition-colors">
                        {u.name}
                      </Link>
                      <span className="font-body text-small text-kore-mid">{u.email}</span>
                    </div>
                  ));
                })}
              </div>
            </div>
          ) : (
            <div className="px-md sm:px-xl py-md">
              <p className="font-body text-small text-kore-mid italic">Keine Benutzer zugewiesen</p>
            </div>
          )}
        </div>
      ))}

      {allStores.length === 0 && (
        <div className="bg-kore-white border border-kore-border p-xl text-center">
          <p className="font-body text-body text-kore-mid">Keine Stores vorhanden.</p>
        </div>
      )}
    </div>
  );
}
