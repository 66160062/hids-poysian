import { ref } from 'vue'
import { api } from 'src/boot/axios'
import { useAuthStore } from 'src/stores/useAuth'
import { UserRole } from 'src/models'

// รอบตรวจที่ยื่นอนุมัติแล้ว inspector แก้ต่อไม่ได้ แต่แอดมินยังตรวจทาน/แก้ได้จนกว่าจะกดอนุมัติ
// สองชุดนี้ต้องตรงกับ LOCKED_ROUND_STATUSES / ADMIN_LOCKED_ROUND_STATUSES ฝั่ง backend (defects.service.ts)
const LOCKED_STATUSES = ['SUBMITTED', 'APPROVED']
const ADMIN_LOCKED_STATUSES = ['APPROVED']

export function useRoundLock(roundId: string | number) {
  const isLocked = ref(false)
  const auth = useAuthStore()

  async function fetchLockState() {
    try {
      const { data } = await api.get<{ status?: string }>(`/inspection-rounds/${roundId}`)
      const lockedStatuses =
        auth.currentUser?.role === UserRole.ADMIN ? ADMIN_LOCKED_STATUSES : LOCKED_STATUSES
      isLocked.value = lockedStatuses.includes(data.status ?? '')
    } catch {
      isLocked.value = false
    }
  }

  return { isLocked, fetchLockState }
}
