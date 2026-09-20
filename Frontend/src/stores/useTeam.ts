import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from 'src/boot/axios';
import type { Team } from 'src/models';

export const useTeamStore = defineStore('team', () => {
  const teams = ref<Team[]>([]);
  const allTeams = ref<Team[]>([]);
  const teamOptions = ref<{ label: string; value: number }[]>([]);
  const isLoading = ref(false);
  const meta = ref({
    total: 0,
    page: 1,
    limit: 5,
    totalPages: 1,
  });

  // ดึงข้อมูลทีม (รองรับ Pagination, Search, Branch Filter)
  const fetchTeams = async (params?: {
    page?: number | undefined;
    limit?: number | undefined;
    search?: string | undefined;
    branchId?: number | null | undefined;
    all?: boolean | undefined;
  }) => {
    isLoading.value = true;
    try {
      const queryParams: Record<string, unknown> = {};
      if (params?.page) queryParams.page = params.page;
      if (params?.limit) queryParams.limit = params.limit;
      if (params?.search) queryParams.search = params.search;
      if (params?.branchId) queryParams.branchId = params.branchId;
      if (params?.all) queryParams.all = params.all;

      const response = await api.get('/teams', { params: queryParams });
      if (response.data && response.data.meta) {
        teams.value = response.data.data;
        meta.value = response.data.meta;
      } else {
        const data = Array.isArray(response.data)
          ? response.data
          : response.data.data || [];
        teams.value = data;
      }
    } catch (error) {
      console.error('Failed to fetch teams', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  // ดึงทีมทั้งหมดสำหรับสร้าง Options ใน Dropdown
  const fetchAllTeams = async () => {
    try {
      const response = await api.get('/teams', { params: { all: true } });
      const data: Team[] = Array.isArray(response.data)
        ? response.data
        : response.data.data || [];
      allTeams.value = data;
      teamOptions.value = data.map((team: Team) => ({
        label: team.team_name,
        value: team.team_Id,
      }));
      return data;
    } catch (error) {
      console.error('Failed to fetch all teams', error);
      return [];
    }
  };

  // สร้างทีมใหม่
  // สังเกตว่า Payload เป็น snake_case ตาม CreateTeamDto ของ Backend
  const createTeam = async (payload: {
    form: {
      team_name: string;
      contact_info?: string;
      branchId?: number | null;
    };
    file: File | null;
  }) => {
    try {
      const requestData = new FormData();
      if (payload.form.team_name) requestData.append('team_name', payload.form.team_name);
      if (payload.form.contact_info) requestData.append('contact_info', payload.form.contact_info);
      if (payload.form.branchId) requestData.append('branchId', String(payload.form.branchId));

      if (payload.file) {
        requestData.append('logo_url', payload.file);
      }

      // ห้ามระบุ Content-Type เอง ปล่อยให้ Axios เติม Boundary ให้
      const response = await api.post('/teams', requestData);
      await fetchTeams();
      return response.data;
    } catch (error) {
      console.error('Failed to create team', error);
      throw error;
    }
  };

  // อัปเดตข้อมูลทีม
  const updateTeam = async (
    id: number,
    payload: {
      form: {
        team_name?: string;
        contact_info?: string;
        branchId?: number | null;
      };
      file: File | null;
    },
  ) => {
    try {
      const requestData = new FormData();
      if (payload.form.team_name) requestData.append('team_name', payload.form.team_name);
      if (payload.form.contact_info) requestData.append('contact_info', payload.form.contact_info);
      if (payload.form.branchId !== undefined) {
        // null หมายถึง "ถอดออกจากสาขา" — ใช้ 0 เป็น sentinel ตามที่ backend รองรับ
        // (multipart/form-data ส่ง null จริงๆ ไม่ได้)
        requestData.append('branchId', String(payload.form.branchId ?? 0));
      }

      if (payload.file) {
        requestData.append('logo_url', payload.file);
      }

      const response = await api.patch(`/teams/${id}`, requestData);
      await fetchTeams();
      return response.data;
    } catch (error) {
      console.error('Failed to update team', error);
      throw error;
    }
  };

  // ลบทีม
  const deleteTeam = async (id: number) => {
    try {
      await api.delete(`/teams/${id}`);
      teams.value = teams.value.filter((t: Team) => t.team_Id !== id);
      teamOptions.value = teamOptions.value.filter((t) => t.value !== id);
    } catch (error) {
      console.error('Failed to delete team', error);
      throw error;
    }
  };

  return {
    teams,
    allTeams,
    teamOptions,
    meta,
    isLoading,
    fetchTeams,
    fetchAllTeams,
    createTeam,
    updateTeam,
    deleteTeam,
  };
});
