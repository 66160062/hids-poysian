import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from 'src/boot/axios';
import type { Team } from 'src/models';

export const useTeamStore = defineStore('team', () => {
  const teams = ref<Team[]>([]);
  const teamOptions = ref<{ label: string; value: number }[]>([]);
  const isLoading = ref(false);

  // ดึงข้อมูลทีมทั้งหมด
  const fetchTeams = async () => {
    isLoading.value = true;
    try {
      const response = await api.get('/teams');
      teams.value = response.data;
      // สร้าง Options สำหรับนำไปใช้ใน Select Dropdown
      teamOptions.value = response.data.map((team: Team) => ({
        label: team.team_name,
        value: team.team_Id,
      }));
    } catch (error) {
      console.error('Failed to fetch teams', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  // สร้างทีมใหม่
  // สังเกตว่า Payload เป็น snake_case ตาม CreateTeamDto ของ Backend
  const createTeam = async (payload: {
    form: {
      team_name: string;
      contact_info?: string;
    };
    file: File | null;
  }) => {
    try {
      const requestData = new FormData();
      if (payload.form.team_name) requestData.append('team_name', payload.form.team_name);
      if (payload.form.contact_info) requestData.append('contact_info', payload.form.contact_info);

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
      };
      file: File | null;
    },
  ) => {
    try {
      const requestData = new FormData();
      if (payload.form.team_name) requestData.append('team_name', payload.form.team_name);
      if (payload.form.contact_info) requestData.append('contact_info', payload.form.contact_info);

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

  return { teams, teamOptions, isLoading, fetchTeams, createTeam, updateTeam, deleteTeam };
});
