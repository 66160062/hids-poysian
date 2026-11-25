import { ref } from 'vue'
import { useAuthStore } from 'src/stores/useAuth'
import { useInspectionStore } from 'src/stores/useInspection'
import { UserRole } from 'src/models'

// รอบตรวจที่ยื่นอนุมัติแล้ว inspector แก้ต่อไม่ได้ แต่แอดมินยังตรวจทาน/แก้ได้จนกว่าจะกดอนุมัติ
// สองชุดนี้ต้องตรงกับ LOCKED_ROUND_STATUSES / ADMIN_LOCKED_ROUND_STATUSES ฝั่ง backend (defects.service.ts)
const LOCKED_STATUSES = ['SUBMITTED', 'APPROVED']
const ADMIN_LOCKED_STATUSES = ['APPROVED']

export function useRoundLock(roundId: string | number) {
  const isLocked = ref(false)
  const auth = useAuthStore()
  const inspectionStore = useInspectionStore()

  // ใช้ข้อมูลรอบที่ cache ไว้ใน store (หลายหน้าในรอบเดียวกันเคยยิง GET รอบเดิมซ้ำทุกครั้งที่เปิด)
  // fresh: true เมื่อต้องการสถานะล่าสุดจริงๆ เช่นหน้าส่งรายงาน
  async function fetchLockState({ fresh = false } = {}) {
    try {
      const round = await inspectionStore.getRound(roundId, { fresh })
      const lockedStatuses =
        auth.currentUser?.role === UserRole.ADMIN ? ADMIN_LOCKED_STATUSES : LOCKED_STATUSES
      isLocked.value = lockedStatuses.includes(round.status ?? '')
    } catch {
      isLocked.value = false
    }
  }

  return { isLocked, fetchLockState }
}
