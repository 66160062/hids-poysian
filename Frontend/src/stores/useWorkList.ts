import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from 'src/boot/axios';

export interface Work {
  jobId: number;
  inspectionType: string;
  projectName: string;
  locationCoordinate: string;
  housePlanUrl: string;
  usableArea: number;
  projectImageUrl: string;
  status: string;
  createdAt: string;
  customer?: {
    customerId: number;
    fullName: string;
    phoneNumber: string;
    email?: string;
    lineId?: string;
  };
  address?: {
    addressId: number;
    houseNumber: string;
    floor: string;
    soi: string;
    subDistrict: string;
    district: string;
    province: string;
    postalCode: string;
  };
  houseType?: {
    house_type_id: number;
    name: string;
  };
  contractor?: {
    contractorId: number;
    fullName: string;
    phoneNumber: string;
    email?: string;
    companyName?: string;
  };
}

export interface StatusMeta {
  key: string;
  label: string;
  bgClass: string;
  textColor: string;
  count: number;
}

export const useWorkListStore = defineStore('workList', () => {
  const works = ref<Work[]>([]);
  const statusMeta = ref<StatusMeta[]>([]);
  const isLoading = ref(false);

  const fetchStatusMeta = async () => {
    try {
      const response = await api.get('/inspection-jobs/statuses/meta');
      statusMeta.value = response.data;
    } catch (error) {
      console.error('Failed to fetch status meta', error);
      // We don't throw here to not break the fetchJobs flow
    }
  };

  const fetchJobs = async () => {
    isLoading.value = true;
    try {
      const response = await api.get('/inspection-jobs');
      // Backend returns { data: [...], meta: ... }
      works.value = Array.isArray(response.data) 
        ? response.data 
        : (response.data.data || []);
      
      await fetchStatusMeta();
    } catch (error) {
      console.error('Failed to fetch jobs', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  const createJob = async (formData: FormData) => {
    try {
      const response = await api.post('/inspection-jobs', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      // Optionally fetch again to update the list, or we just rely on page reload.
      return response.data;
    } catch (error) {
      console.error('Failed to create job', error);
      throw error;
    }
  };

  const removeJob = async (id: number) => {
    try {
      await api.delete(`/inspection-jobs/${id}`);
      works.value = works.value.filter((w) => w.jobId !== id);
    } catch (error) {
      console.error('Failed to delete job', error);
      throw error;
    }
  };

  const updateJob = async (id: number, formData: FormData) => {
    try {
      const response = await api.patch(`/inspection-jobs/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to update job', error);
      throw error;
    }
  };

  return { works, statusMeta, isLoading, fetchJobs, fetchStatusMeta, createJob, removeJob, updateJob };
});
