import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { api } from 'src/boot/axios';
import { t } from 'src/boot/i18n';

export interface Branch {
  branchId: number;
  branchName: string | null;
  logoUrl: string | null;
  status: string;
  phoneNumber: string | null;
  mailAddress: string | null;
  facebook: string | null;
  line: string | null;
}

export interface BranchOption {
  label: string;
  value: number;
}

function getStoredBranchId(): number | 'all' {
  const raw = sessionStorage.getItem('adminSelectedBranchId');
  const branchId = Number(raw);
  return Number.isInteger(branchId) && branchId > 0 ? branchId : 'all';
}

export type AdminPageKey = 'dashboard' | 'work' | 'users' | 'teams';

export const useBranchStore = defineStore('branch', () => {
  const branches = ref<Branch[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const selectedBranchId = ref<number | 'all'>(getStoredBranchId());

  const localBranchOverrides = ref<Record<AdminPageKey, number | 'all' | null>>({
    dashboard: null,
    work: null,
    users: null,
    teams: null,
  });

  function setSelectedBranchId(id: number | 'all' | null): void {
    const finalId = id === null ? 'all' : id;
    selectedBranchId.value = finalId;
    // Master Reset: เคลียร์ local overrides ของทุกหน้า เพื่อให้ทุกหน้าใช้ค่า Global ใหม่พร้อมกัน
    localBranchOverrides.value = {
      dashboard: null,
      work: null,
      users: null,
      teams: null,
    };

    if (finalId === 'all') {
      sessionStorage.removeItem('adminSelectedBranchId');
    } else {
      sessionStorage.setItem('adminSelectedBranchId', String(finalId));
    }
  }

  function setPageBranch(pageKey: AdminPageKey, id: number | 'all' | null): void {
    localBranchOverrides.value[pageKey] = id;
  }

  function getPageBranch(pageKey: AdminPageKey): number | 'all' {
    const local = localBranchOverrides.value[pageKey];
    if (local !== null && local !== undefined) {
      return local;
    }
    return selectedBranchId.value;
  }

  const branchOptions = computed<BranchOption[]>(() =>
    branches.value.map((branch) => ({
      label: branch.branchName || t('common.branch.fallbackName', { id: branch.branchId }),
      value: branch.branchId,
    })),
  );

  const fetchBranches = async () => {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.get<Branch[]>('/branches');
      branches.value = response.data;
    } catch (e) {
      error.value = t('common.branch.loadError');
      console.error(e);
    } finally {
      loading.value = false;
    }
  };

  const saveBranch = async (
    id: number | null,
    name: string,
    logo: File | null,
  ): Promise<Branch> => {
    const formData = new FormData();
    formData.append('branchName', name);
    if (logo) formData.append('logo', logo);

    const response = id
      ? await api.patch<Branch>(`/branches/${id}`, formData)
      : await api.post<Branch>('/branches', formData);

    await fetchBranches();
    return response.data;
  };

  return {
    branches,
    branchOptions,
    selectedBranchId,
    setSelectedBranchId,
    localBranchOverrides,
    setPageBranch,
    getPageBranch,
    loading,
    error,
    fetchBranches,
    saveBranch,
  };
});
