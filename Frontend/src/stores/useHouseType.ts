import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from 'src/boot/axios';

export interface HouseType {
  house_type_id: number;
  name: string;
}

export const useHouseTypeStore = defineStore('houseType', () => {
  const houseTypes = ref<HouseType[]>([]);
  const isLoading = ref(false);

  const fetchHouseTypes = async () => {
    isLoading.value = true;
    try {
      const response = await api.get('/house-types');
      houseTypes.value = Array.isArray(response.data) 
        ? response.data 
        : (response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch house types', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  return { houseTypes, isLoading, fetchHouseTypes };
});
