import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from 'src/boot/axios';

export interface Contractor {
  contractorId: number;
  fullName: string;
  phoneNumber: string;
  email?: string;
  companyName?: string;
}

export const useContractorStore = defineStore('contractor', () => {
  const contractors = ref<Contractor[]>([]);
  const isLoading = ref(false);

  const fetchContractors = async () => {
    isLoading.value = true;
    try {
      const res = await api.get('/contractors');
      contractors.value = res.data.map((c: Contractor) => ({
        contractorId: c.contractorId,
        fullName: c.fullName,
        phoneNumber: c.phoneNumber,
        email: c.email || '',
        companyName: c.companyName || '',
      }));
    } catch (error) {
      console.error('Failed to fetch contractors', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  const createContractor = async (payload: { fullName: string; phoneNumber: string; email?: string; companyName?: string }) => {
    try {
      const response = await api.post('/contractors', {
        fullName: payload.fullName,
        phoneNumber: payload.phoneNumber,
        email: payload.email || '',
        companyName: payload.companyName || '',
      });
      const newContractor: Contractor = {
        contractorId: response.data.contractorId || response.data.id,
        fullName: payload.fullName,
        phoneNumber: payload.phoneNumber,
        email: payload.email || '',
        companyName: payload.companyName || '',
      };
      contractors.value.unshift(newContractor);
      return newContractor;
    } catch (error) {
      console.error('Failed to create contractor', error);
      throw error;
    }
  };

  const updateContractor = async (id: number, payload: { fullName: string; phoneNumber: string; email?: string; companyName?: string }) => {
    try {
      const response = await api.patch(`/contractors/${id}`, {
        fullName: payload.fullName,
        phoneNumber: payload.phoneNumber,
        email: payload.email || '',
        companyName: payload.companyName || '',
      });
      const idx = contractors.value.findIndex(c => c.contractorId === id);
      if (idx !== -1) {
        contractors.value.splice(idx, 1, {
          contractorId: id,
          fullName: payload.fullName,
          phoneNumber: payload.phoneNumber,
          email: payload.email || '',
          companyName: payload.companyName || '',
        });
      }
      return response.data;
    } catch (error) {
      console.error('Failed to update contractor', error);
      throw error;
    }
  };

  return {
    contractors,
    isLoading,
    fetchContractors,
    createContractor,
    updateContractor,
  };
});
