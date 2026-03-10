import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Region } from '../shared/types';

interface RegionListItem extends Region {
  _count: { stores: number };
}

interface RegionDetailStore {
  id: string;
  name: string;
  city: string | null;
  isActive: boolean;
  _count: { tools: number; userAssignments: number };
}

interface RegionDetail extends Omit<Region, 'stores'> {
  stores: RegionDetailStore[];
}

export function useRegions(tenantId?: string) {
  const qs = tenantId ? `?tenantId=${tenantId}` : '';
  return useQuery<RegionListItem[]>({
    queryKey: ['regions', tenantId ?? 'all'],
    queryFn: () => api(`/api/admin/regions${qs}`),
  });
}

export function useRegion(id: string | undefined) {
  return useQuery<RegionDetail>({
    queryKey: ['regions', id],
    queryFn: () => api(`/api/admin/regions/${id}`),
    enabled: !!id,
  });
}

export function useCreateRegion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { tenantId: string; name: string; description?: string; sortOrder?: number }) =>
      api('/api/admin/regions', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['regions'] });
      qc.invalidateQueries({ queryKey: ['reporting'] });
    },
  });
}

export function useUpdateRegion(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name?: string; description?: string; sortOrder?: number }) =>
      api(`/api/admin/regions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['regions'] });
      qc.invalidateQueries({ queryKey: ['reporting'] });
    },
  });
}

export function useDeleteRegion(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api(`/api/admin/regions/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['regions'] });
      qc.invalidateQueries({ queryKey: ['stores'] });
      qc.invalidateQueries({ queryKey: ['reporting'] });
    },
  });
}

export function useUpdateRegionStores(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (storeIds: string[]) =>
      api(`/api/admin/regions/${id}/stores`, { method: 'PUT', body: JSON.stringify({ storeIds }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['regions'] });
      qc.invalidateQueries({ queryKey: ['stores'] });
      qc.invalidateQueries({ queryKey: ['reporting'] });
    },
  });
}
