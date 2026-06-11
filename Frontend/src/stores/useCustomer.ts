import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from 'src/boot/axios';

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email?: string | undefined;
  lineId?: string | undefined;
}

export const useCustomerStore = defineStore('customer', () => {
  const customers = ref<Customer[]>([]);
  const isLoading = ref(false);

  const fetchCustomers = async () => {
    isLoading.value = true;
    try {
      const res = await api.get('/customers');
      customers.value = res.data.map((c: { customerId: number; fullName: string; phoneNumber: string; email?: string; lineId?: string }) => ({
        id: c.customerId,
        name: c.fullName,
        phone: c.phoneNumber,
        email: c.email || '',
        lineId: c.lineId || '',
      }));
    } catch (error) {
      console.error('Failed to fetch customers', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  const createCustomer = async (payload: { name: string; phone: string; email?: string; lineId?: string }) => {
    try {
      const response = await api.post('/customers', {
        fullName: payload.name,
        phoneNumber: payload.phone,
        email: payload.email || '',
        lineId: payload.lineId || '',
      });
      // เพิ่มลงใน state ทันทีจะได้ไม่ต้องดึงใหม่ทั้งหมด หรือจะดึงใหม่ก็ได้
      const newCustomer: Customer = {
        id: response.data.customerId || response.data.id,
        name: payload.name,
        phone: payload.phone,
        email: payload.email,
        lineId: payload.lineId,
      };
      customers.value.unshift(newCustomer);
      return newCustomer;
    } catch (error) {
      console.error('Failed to create customer', error);
      throw error;
    }
  };

  const updateCustomer = async (id: number, payload: { name: string; phone: string; email?: string; lineId?: string }) => {
    try {
      const response = await api.patch(`/customers/${id}`, {
        fullName: payload.name,
        phoneNumber: payload.phone,
        email: payload.email || '',
        lineId: payload.lineId || '',
      });
      const idx = customers.value.findIndex(c => c.id === id);
      if (idx !== -1) {
        customers.value.splice(idx, 1, {
          id,
          name: payload.name,
          phone: payload.phone,
          email: payload.email,
          lineId: payload.lineId,
        });
      }
      return response.data;
    } catch (error) {
      console.error('Failed to update customer', error);
      throw error;
    }
  };

  return {
    customers,
    isLoading,
    fetchCustomers,
    createCustomer,
    updateCustomer,
  };
});
