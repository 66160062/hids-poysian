import { useRoute } from 'vue-router';

// หน้าตรวจ (InspectionPage / RoomDefectPage / AddDefectPage / VerifyDefectPage) ใช้ร่วมกัน
// ระหว่าง inspector กับ admin แต่ผูกอยู่คนละ route tree — ถ้า hardcode ชื่อ route ของ inspector ไว้
// แอดมินที่กดเข้ามาจะหลุดไปโผล่ shell ของ inspector กลางคัน จึงเลือกชื่อตาม tree ที่กำลังอยู่
export function useInspectionRoutes() {
  const route = useRoute();
  const isAdminScope = route.path.startsWith('/admin');

  return {
    isAdminScope,
    roomDefectRoute: isAdminScope ? 'adminRoomDefect' : 'roomDefect',
    addDefectRoute: isAdminScope ? 'adminAddDefect' : 'addDefect',
    verifyDefectRoute: isAdminScope ? 'adminVerifyDefect' : 'verifyDefect',
  };
}
