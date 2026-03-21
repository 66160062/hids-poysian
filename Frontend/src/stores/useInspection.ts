import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from 'src/boot/axios';
import type { Category, SubCategory } from 'src/models.ts';

export const useInspectionStore = defineStore('inspection', () => {
  const rooms = ref<any[]>([]);
  const categories = ref<Category[]>([]);
  const subCategories = ref<SubCategory[]>([]);
  const isLoading = ref(false);
  const allRooms = computed(() => rooms.value);
  const allCategories = computed(() => categories.value);

  const getSubByCategoryId = (selectedId: number) => {
    return subCategories.value.filter((sub: any) => {
      return sub.category && Number(sub.category.categoryId) === Number(selectedId);
    });
  };
  async function fetchInspectionMasterData(_roundId: string | number) {
    isLoading.value = true;
    try {
      const [catRes, subRes] = await Promise.all([
        api.get('/defect-categories'),
        api.get('/defect-sub-categories'),
      ]);

      //rooms.value = roomRes.data;
      categories.value = catRes.data;
      subCategories.value = subRes.data;
    } catch (err) {
      console.error('Fetch Master Data Error:', err);
    } finally {
      isLoading.value = false;
    }
  }

  async function saveDefect(payload: FormData) {
    try {
      const res = await api.post('/defects', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    } catch (err) {
      console.error('Save Defect Error:', err);
      throw err;
    }
  }
  function clearData() {
    rooms.value = [];
    categories.value = [];
    subCategories.value = [];
  }

  return {
    rooms,
    categories,
    subCategories,
    isLoading,
    allRooms,
    allCategories,
    getSubByCategoryId,
    fetchInspectionMasterData,
    saveDefect,
    clearData,
  };
});
