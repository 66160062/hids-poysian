import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from 'src/boot/axios';
import type {
  Room,
  CreateRoomDto,
  UpdateRoomDto,
  SubRoom,
  CreateSubRoomDto,
  UpdateSubRoomDto,
  DefectCategory,
  CreateDefectCategoryDto,
  UpdateDefectCategoryDto,
  DefectSubCategory,
  CreateDefectSubCategoryDto,
  UpdateDefectSubCategoryDto,
} from 'src/types/master-data';

export const useMasterDataStore = defineStore('masterData', () => {
  // State
  const rooms = ref<Room[]>([]);
  const subRooms = ref<SubRoom[]>([]);
  const defectCategories = ref<DefectCategory[]>([]);
  const defectSubCategories = ref<DefectSubCategory[]>([]);
  const loading = ref(false);

  // --- Rooms CRUD ---
  const fetchRooms = async () => {
    loading.value = true;
    try {
      const res = await api.get<Room[]>('/rooms');
      rooms.value = Array.isArray(res.data) ? res.data : [];
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
    } finally {
      loading.value = false;
    }
  };

  const createRoom = async (dto: CreateRoomDto) => {
    const res = await api.post<Room>('/rooms', dto);
    await fetchRooms();
    return res.data;
  };

  const updateRoom = async (id: number, dto: UpdateRoomDto) => {
    const res = await api.patch<Room>(`/rooms/${id}`, dto);
    await fetchRooms();
    return res.data;
  };

  const deleteRoom = async (id: number) => {
    await api.delete(`/rooms/${id}`);
    await fetchRooms();
  };

  // --- Sub-Rooms CRUD ---
  const fetchSubRooms = async () => {
    loading.value = true;
    try {
      const res = await api.get<SubRoom[]>('/sub-rooms');
      subRooms.value = Array.isArray(res.data) ? res.data : [];
    } catch (err) {
      console.error('Failed to fetch sub-rooms:', err);
    } finally {
      loading.value = false;
    }
  };

  const createSubRoom = async (dto: CreateSubRoomDto) => {
    const res = await api.post<SubRoom>('/sub-rooms', dto);
    await fetchSubRooms();
    return res.data;
  };

  const updateSubRoom = async (id: number, dto: UpdateSubRoomDto) => {
    const res = await api.patch<SubRoom>(`/sub-rooms/${id}`, dto);
    await fetchSubRooms();
    return res.data;
  };

  const deleteSubRoom = async (id: number) => {
    await api.delete(`/sub-rooms/${id}`);
    await fetchSubRooms();
  };

  // --- Defect Categories CRUD ---
  const fetchDefectCategories = async () => {
    loading.value = true;
    try {
      let res;
      try {
        res = await api.get<DefectCategory[]>('/Defect-categories');
      } catch {
        res = await api.get<DefectCategory[]>('/defect-categories');
      }
      defectCategories.value = Array.isArray(res.data) ? res.data : [];
    } catch (err) {
      console.error('Failed to fetch defect categories:', err);
    } finally {
      loading.value = false;
    }
  };

  const createDefectCategory = async (dto: CreateDefectCategoryDto) => {
    let res;
    try {
      res = await api.post<DefectCategory>('/Defect-categories', dto);
    } catch {
      res = await api.post<DefectCategory>('/defect-categories', dto);
    }
    await fetchDefectCategories();
    return res.data;
  };

  const updateDefectCategory = async (id: number, dto: UpdateDefectCategoryDto) => {
    let res;
    try {
      res = await api.patch<DefectCategory>(`/Defect-categories/${id}`, dto);
    } catch {
      res = await api.patch<DefectCategory>(`/defect-categories/${id}`, dto);
    }
    await fetchDefectCategories();
    return res.data;
  };

  const deleteDefectCategory = async (id: number) => {
    try {
      await api.delete(`/Defect-categories/${id}`);
    } catch {
      await api.delete(`/defect-categories/${id}`);
    }
    await fetchDefectCategories();
  };

  // --- Defect Sub-Categories CRUD ---
  const fetchDefectSubCategories = async () => {
    loading.value = true;
    try {
      const res = await api.get<DefectSubCategory[]>('/defect-sub-categories');
      defectSubCategories.value = Array.isArray(res.data) ? res.data : [];
    } catch (err) {
      console.error('Failed to fetch defect sub categories:', err);
    } finally {
      loading.value = false;
    }
  };

  const createDefectSubCategory = async (dto: CreateDefectSubCategoryDto) => {
    const res = await api.post<DefectSubCategory>('/defect-sub-categories', dto);
    await fetchDefectSubCategories();
    return res.data;
  };

  const updateDefectSubCategory = async (id: number, dto: UpdateDefectSubCategoryDto) => {
    const res = await api.patch<DefectSubCategory>(`/defect-sub-categories/${id}`, dto);
    await fetchDefectSubCategories();
    return res.data;
  };

  const deleteDefectSubCategory = async (id: number) => {
    await api.delete(`/defect-sub-categories/${id}`);
    await fetchDefectSubCategories();
  };

  // Helper to fetch all master data at once
  const fetchAll = async () => {
    loading.value = true;
    try {
      await Promise.all([
        fetchRooms(),
        fetchSubRooms(),
        fetchDefectCategories(),
        fetchDefectSubCategories(),
      ]);
    } finally {
      loading.value = false;
    }
  };

  return {
    rooms,
    subRooms,
    defectCategories,
    defectSubCategories,
    loading,

    fetchRooms,
    createRoom,
    updateRoom,
    deleteRoom,

    fetchSubRooms,
    createSubRoom,
    updateSubRoom,
    deleteSubRoom,

    fetchDefectCategories,
    createDefectCategory,
    updateDefectCategory,
    deleteDefectCategory,

    fetchDefectSubCategories,
    createDefectSubCategory,
    updateDefectSubCategory,
    deleteDefectSubCategory,

    fetchAll,
  };
});
