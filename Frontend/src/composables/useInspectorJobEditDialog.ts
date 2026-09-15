import { ref } from 'vue';

// Toggle ที่ใช้ร่วมกันระหว่าง InspectorScreen.vue (ปุ่มแก้ไขบน nav bar)
// กับ InspectorDetailPage.vue (เจ้าของ dialog แก้ไขจริง) เพราะปุ่มอยู่คนละ component กัน
const isOpen = ref(false);

export function useInspectorJobEditDialog() {
  return { isOpen };
}
