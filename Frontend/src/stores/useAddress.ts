import { defineStore } from 'pinia';
import { api } from 'src/boot/axios';

export const useAddressStore = defineStore('address', () => {
  const createAddress = async (payload: {
    roomNumber: string;
    floor: string;
    province: string;
    district: string;
    subdistrict: string;
    postalCode: string;
  }) => {
    try {
      const response = await api.post('/addresses', {
        houseNumber: payload.roomNumber || '-',
        floor: payload.floor || '-',
        soi: '-',
        subDistrict: payload.subdistrict || '-',
        district: payload.district || '-',
        province: payload.province || '-',
        postalCode: payload.postalCode || '-',
      });
      return response.data.addressId || response.data.id || 1;
    } catch (error) {
      console.error('Failed to create address', error);
      throw error;
    }
  };

  const updateAddress = async (id: number, payload: {
    roomNumber: string;
    floor: string;
    province: string;
    district: string;
    subdistrict: string;
    postalCode: string;
  }) => {
    try {
      const response = await api.patch(`/addresses/${id}`, {
        houseNumber: payload.roomNumber || '-',
        floor: payload.floor || '-',
        soi: '-',
        subDistrict: payload.subdistrict || '-',
        district: payload.district || '-',
        province: payload.province || '-',
        postalCode: payload.postalCode || '-',
      });
      return response.data;
    } catch (error) {
      console.error('Failed to update address', error);
      throw error;
    }
  };

  return { createAddress, updateAddress };
});
