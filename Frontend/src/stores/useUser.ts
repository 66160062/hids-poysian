import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from 'src/boot/axios';
import type { User } from 'src/models';

export const useUserStore = defineStore('user', () => {
  const users = ref<User[]>([]);
  const allUsers = ref<User[]>([]);
  const isLoading = ref(false);
  const meta = ref({
    total: 0,
    page: 1,
    limit: 5,
    totalPages: 1,
  });

  // ดึงข้อมูล User (รองรับ Pagination, Search, Filter)
  const fetchUsers = async (params?: {
    page?: number | undefined;
    limit?: number | undefined;
    search?: string | undefined;
    role?: string | undefined;
    branchId?: number | null | undefined;
    all?: boolean | undefined;
  }) => {
    isLoading.value = true;
    try {
      const queryParams: Record<string, unknown> = {};
      if (params?.page) queryParams.page = params.page;
      if (params?.limit) queryParams.limit = params.limit;
      if (params?.search) queryParams.search = params.search;
      if (params?.role && params.role !== 'all') queryParams.role = params.role;
      if (params?.branchId) queryParams.branchId = params.branchId;
      if (params?.all) queryParams.all = params.all;

      const response = await api.get('/users', { params: queryParams });
      if (response.data && response.data.meta) {
        users.value = response.data.data;
        meta.value = response.data.meta;
      } else {
        users.value = Array.isArray(response.data)
          ? response.data
          : response.data.data || [];
      }
    } catch (error) {
      console.error('Failed to fetch users', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  // ดึง User ทั้งหมดสำหรับใช้ใน Dropdown / Selector
  const fetchAllUsers = async () => {
    try {
      const response = await api.get('/users', { params: { all: true } });
      const data = Array.isArray(response.data)
        ? response.data
        : response.data.data || [];
      allUsers.value = data;
      return data;
    } catch (error) {
      console.error('Failed to fetch all users', error);
      return [];
    }
  };

  // สร้าง User ใหม่
  const createUser = async (payload: { form: Partial<User>; file: File | null }) => {
    try {
      const requestData = new FormData();

      // Append form fields
      if (payload.form.fullName !== undefined) requestData.append('fullName', payload.form.fullName);
      if (payload.form.phoneNumber !== undefined) requestData.append('phoneNumber', payload.form.phoneNumber);
      if (payload.form.email !== undefined) requestData.append('email', payload.form.email);
      if (payload.form.lineId !== undefined) requestData.append('lineId', payload.form.lineId);
      if (payload.form.role !== undefined) requestData.append('role', payload.form.role);
      if (payload.form.password !== undefined) requestData.append('password', payload.form.password);
      if (payload.form.branchId !== undefined) {
        requestData.append('branchId', (payload.form.branchId ?? 0).toString());
      }
      if (payload.form.teamId !== undefined) {
        requestData.append('teamId', (payload.form.teamId ?? 0).toString());
      }

      // Append file
      if (payload.file) {
        requestData.append('imageUrl', payload.file);
      }

      const response = await api.post('/users', requestData);
      await fetchUsers(); // Refresh
      return response.data;
    } catch (error) {
      console.error('Failed to create user', error);
      throw error;
    }
  };

  // อัปเดตข้อมูล User
  const updateUser = async (
    id: number,
    payload: {
      form: Partial<User>;
      file: File | null;
    },
  ) => {
    try {
      const requestData = new FormData();

      // Append form fields
      if (payload.form.fullName !== undefined) requestData.append('fullName', payload.form.fullName);
      if (payload.form.phoneNumber !== undefined) requestData.append('phoneNumber', payload.form.phoneNumber);
      if (payload.form.email !== undefined) requestData.append('email', payload.form.email);
      if (payload.form.lineId !== undefined) requestData.append('lineId', payload.form.lineId);
      if (payload.form.role !== undefined) requestData.append('role', payload.form.role);
      if (payload.form.password !== undefined) requestData.append('password', payload.form.password);
      if (payload.form.branchId !== undefined) {
        requestData.append('branchId', (payload.form.branchId ?? 0).toString());
      }
      if (payload.form.teamId !== undefined) {
        requestData.append('teamId', (payload.form.teamId ?? 0).toString());
      }

      // Append file
      if (payload.file) {
        requestData.append('imageUrl', payload.file);
      }

      const response = await api.patch(`/users/${id}`, requestData);
      await fetchUsers();
      return response.data;
    } catch (error) {
      console.error('Failed to update user', error);
      throw error;
    }
  };

  // ลบ User
  const deleteUser = async (id: number) => {
    try {
      await api.delete(`/users/${id}`);
      users.value = users.value.filter((u) => u.id !== id);
    } catch (error) {
      console.error('Failed to delete user', error);
      throw error;
    }
  };

  return {
    users,
    allUsers,
    meta,
    isLoading,
    fetchUsers,
    fetchAllUsers,
    createUser,
    updateUser,
    deleteUser,
  };
});
