import { defineBoot } from '#q-app/wrappers';
import axios, { type AxiosInstance } from 'axios';
import { useAuthStore } from 'src/stores/useAuth';

declare module 'vue' {
  interface ComponentCustomProperties {
    $axios: AxiosInstance;
    $api: AxiosInstance;
  }
}

// Be careful when using SSR for cross-request state pollution
// due to creating a Singleton instance here;
// If any client changes this (global) instance, it might be a
// good idea to move this instance creation inside of the
// "export default () => {}" function below (which runs individually
// for each client)
// timeout สำหรับ flow ตรวจหน้างาน (สัญญาณอ่อน) ไม่ให้ request ค้างตลอดกาล: loader ไม่หาย, การ์ดค้าง "กำลังบันทึก"
// ใส่เป็นราย request ไม่ตั้งเป็นค่า default เพราะบาง request ใช้เวลานานโดยธรรมชาติ (สร้าง PDF/AI, อัปโหลดแปลน)
export const REQUEST_TIMEOUT_MS = 20_000;
// อัปโหลดรูปผ่าน 4G ช้าใช้เวลานานกว่า request ทั่วไป
export const UPLOAD_TIMEOUT_MS = 60_000;

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

export default defineBoot(({ app }) => {
  // ⭐ เพิ่ม Request Interceptor (แนบ JWT Token)
  api.interceptors.request.use((config) => {
    const auth = useAuthStore();

    if (auth.token) {
      config.headers.Authorization = `Bearer ${auth.token}`;
    }

    return config;
  });

  // ⭐ เพิ่ม Response Interceptor (เช็ค 401)
  api.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      if (error.response?.status === 401) {
        const auth = useAuthStore();
        auth.logout();
      }

      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    },
  );

  // for use inside Vue files (Options API) through this.$axios and this.$api
  app.config.globalProperties.$axios = axios;

  // this.$api
  app.config.globalProperties.$api = api;
});

export { api };
