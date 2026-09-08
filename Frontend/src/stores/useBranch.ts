import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from 'src/boot/axios';

export interface Branch {
  branchId: number;
  branchName: string | null;
  logoUrl: string | null;
  status: string;
  teamId?: number | null;
}

export const useBranchStore = defineStore('branch', () => {
  const branches = ref<Branch[]>([]);
  const fetchBranches = async () => { branches.value = (await api.get<Branch[]>('/branches')).data; };
  const saveBranch = async (id: number | null, name: string, logo: File | null) => {
    const data = new FormData(); data.append('branchName', name); if (logo) data.append('logo', logo);
    const response = id ? await api.patch<Branch>(`/branches/${id}`, data) : await api.post<Branch>('/branches', data);
    await fetchBranches(); return response.data;
  };
  return { branches, fetchBranches, saveBranch };
});
