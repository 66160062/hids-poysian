import { defineStore } from 'pinia';
import { api } from 'src/boot/axios';

export const useAddressStore = defineStore('address', () => {
  const createAddress = async (payload: {
    houseNumber: string;
    soi: string;
    province: string;
    district: string;
    subDistrict: string;
    postalCode: string;
  }) => {
    try {
      const response = await api.post('/addresses', {
        houseNumber: payload.houseNumber || '',
        soi: payload.soi || '',
        subDistrict: payload.subDistrict || '',
        district: payload.district || '',
        province: payload.province || '',
        postalCode: payload.postalCode || '',
      });
      return response.data.addressId || response.data.id || 1;
    } catch (error) {
      console.error('Failed to create address', error);
      throw error;
    }
  };

  const updateAddress = async (
    id: number,
    payload: {
      houseNumber: string;
      soi: string;
      province: string;
      district: string;
      subDistrict: string;
      postalCode: string;
    },
  ) => {
    try {
      const response = await api.patch(`/addresses/${id}`, {
        houseNumber: payload.houseNumber || '',
        soi: payload.soi || '',
        subDistrict: payload.subDistrict || '',
        district: payload.district || '',
        province: payload.province || '',
        postalCode: payload.postalCode || '',
      });
      return response.data;
    } catch (error) {
      console.error('Failed to update address', error);
      throw error;
    }
  };

  return { createAddress, updateAddress };
});
