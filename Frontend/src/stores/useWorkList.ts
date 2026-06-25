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
  isReadyForRound2?: boolean;
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
  rounds?: {
    roundId: number;
    roundNumber?: number;
    status: string;
    scheduledDate: string;
  }[];
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

  const meta = ref({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1
  });

  const absoluteJobCounts = ref({
    all: 0,
    defect: 0,
    construction: 0
  });

  const fetchAbsoluteJobCounts = async () => {
    try {
      const [resAll, resDef, resCon] = await Promise.all([
        api.get('/inspection-jobs', { params: { limit: 1 } }),
        api.get('/inspection-jobs', { params: { limit: 1, inspectionType: 'ตรวจบ้าน' } }),
        api.get('/inspection-jobs', { params: { limit: 1, inspectionType: 'งานก่อสร้าง' } })
      ]);
      absoluteJobCounts.value.all = resAll.data?.meta?.total || 0;
      absoluteJobCounts.value.defect = resDef.data?.meta?.total || 0;
      absoluteJobCounts.value.construction = resCon.data?.meta?.total || 0;
    } catch (error) {
      console.error('Failed to fetch absolute counts', error);
    }
  };

  const fetchStatusMeta = async (params: { search?: string, type?: string, inspectionType?: string } = {}) => {
    try {
      const response = await api.get('/inspection-jobs/statuses/meta', { params });
      statusMeta.value = response.data;
    } catch (error) {
      console.error('Failed to fetch status meta', error);
      // We don't throw here to not break the fetchJobs flow
    }
  };

  const fetchJobs = async (params: { page?: number, limit?: number, status?: string, search?: string, type?: string, sort?: string, inspectionType?: string } = {}) => {
    isLoading.value = true;
    try {
      const response = await api.get('/inspection-jobs', { params });
      // Backend returns { data: [...], meta: ... }
      if (response.data && response.data.meta) {
        works.value = response.data.data;
        meta.value = response.data.meta;
      } else {
        works.value = Array.isArray(response.data)
          ? response.data
          : (response.data.data || []);
      }

      const metaParams: { search?: string, type?: string, inspectionType?: string } = {};
      if (params.search) metaParams.search = params.search;
      if (params.type) metaParams.type = params.type;
      if (params.inspectionType) metaParams.inspectionType = params.inspectionType;

      await fetchStatusMeta(metaParams);
    } catch (error) {
      console.error('Failed to fetch jobs', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  const createJob = async (formData: FormData) => {
    try {
      const response = await api.post('/inspection-jobs', formData);
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
      const response = await api.patch(`/inspection-jobs/${id}`, formData);
      return response.data;
    } catch (error) {
      console.error('Failed to update job', error);
      throw error;
    }
  };

  return { works, statusMeta, meta, absoluteJobCounts, isLoading, fetchJobs, fetchStatusMeta, fetchAbsoluteJobCounts, createJob, removeJob, updateJob };
});
