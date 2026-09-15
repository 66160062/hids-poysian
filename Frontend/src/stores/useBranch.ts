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

export const useBranchStore = defineStore('branch', () => {
  const branches = ref<Branch[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

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
    loading,
    error,
    fetchBranches,
    saveBranch,
  };
});
