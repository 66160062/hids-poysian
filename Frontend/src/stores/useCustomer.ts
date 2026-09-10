import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from 'src/boot/axios';

export interface Customer {
  id: number;
  name: string;
  phone: string;
  phone2?: string | undefined;
  phone3?: string | undefined;
  email?: string | undefined;
  email2?: string | undefined;
  email3?: string | undefined;
  lineId?: string | undefined;
}

export const useCustomerStore = defineStore('customer', () => {
  const customers = ref<Customer[]>([]);
  const isLoading = ref(false);

  const fetchCustomers = async () => {
    isLoading.value = true;
    try {
      const res = await api.get('/customers');
      customers.value = res.data.map((c: { customerId: number; fullName: string; phoneNumber: string; phoneNumber2?: string; phoneNumber3?: string; email?: string; email2?: string; email3?: string; lineId?: string }) => ({
        id: c.customerId,
        name: c.fullName,
        phone: c.phoneNumber,
        phone2: c.phoneNumber2 || '',
        phone3: c.phoneNumber3 || '',
        email: c.email || '',
        email2: c.email2 || '',
        email3: c.email3 || '',
        lineId: c.lineId || '',
      }));
    } catch (error) {
      console.error('Failed to fetch customers', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  interface CustomerPayload {
    name: string;
    phone: string;
    phone2?: string | undefined;
    phone3?: string | undefined;
    email?: string | undefined;
    email2?: string | undefined;
    email3?: string | undefined;
    lineId?: string | undefined;
  }

  const createCustomer = async (payload: CustomerPayload) => {
    try {
      const response = await api.post('/customers', {
        fullName: payload.name,
        phoneNumber: payload.phone,
        phoneNumber2: payload.phone2 || undefined,
        phoneNumber3: payload.phone3 || undefined,
        email: payload.email || '',
        email2: payload.email2 || undefined,
        email3: payload.email3 || undefined,
        lineId: payload.lineId || '',
      });
      // เพิ่มลงใน state ทันทีจะได้ไม่ต้องดึงใหม่ทั้งหมด หรือจะดึงใหม่ก็ได้
      const newCustomer: Customer = {
        id: response.data.customerId || response.data.id,
        name: payload.name,
        phone: payload.phone,
        phone2: payload.phone2,
        phone3: payload.phone3,
        email: payload.email,
        email2: payload.email2,
        email3: payload.email3,
        lineId: payload.lineId,
      };
      customers.value.unshift(newCustomer);
      return newCustomer;
    } catch (error) {
      console.error('Failed to create customer', error);
      throw error;
    }
  };

  const updateCustomer = async (id: number, payload: CustomerPayload) => {
    try {
      const response = await api.patch(`/customers/${id}`, {
        fullName: payload.name,
        phoneNumber: payload.phone,
        phoneNumber2: payload.phone2 || undefined,
        phoneNumber3: payload.phone3 || undefined,
        email: payload.email || '',
        email2: payload.email2 || undefined,
        email3: payload.email3 || undefined,
        lineId: payload.lineId || '',
      });
      const idx = customers.value.findIndex(c => c.id === id);
      if (idx !== -1) {
        customers.value.splice(idx, 1, {
          id,
          name: payload.name,
          phone: payload.phone,
          phone2: payload.phone2,
          phone3: payload.phone3,
          email: payload.email,
          email2: payload.email2,
          email3: payload.email3,
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
