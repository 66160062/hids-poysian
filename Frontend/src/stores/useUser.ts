import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from 'src/boot/axios';
import type { User } from 'src/models';

export const useUserStore = defineStore('user', () => {
  const users = ref<User[]>([]);
  const isLoading = ref(false);

  // ดึงข้อมูล User ทั้งหมด
  const fetchUsers = async () => {
    isLoading.value = true;
    try {
      const response = await api.get('/users');
      users.value = response.data;
    } catch (error) {
      console.error('Failed to fetch users', error);
      throw error;
    } finally {
      isLoading.value = false;
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
      if (payload.form.teamId !== undefined) requestData.append('teamId', payload.form.teamId.toString());

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
      if (payload.form.teamId !== undefined) requestData.append('teamId', payload.form.teamId.toString());

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
    isLoading,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
  };
});
