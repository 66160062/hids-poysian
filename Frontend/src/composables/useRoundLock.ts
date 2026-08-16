import { ref } from 'vue'
import { api } from 'src/boot/axios'

const LOCKED_STATUSES = ['SUBMITTED', 'APPROVED']

// รอบตรวจที่ยื่นอนุมัติ (หรืออนุมัติแล้ว) ห้ามแก้ไข defect/สรุปรายงาน แต่ยังดูได้
export function useRoundLock(roundId: string | number) {
  const isLocked = ref(false)

  async function fetchLockState() {
    try {
      const { data } = await api.get<{ status?: string }>(`/inspection-rounds/${roundId}`)
      isLocked.value = LOCKED_STATUSES.includes(data.status ?? '')
    } catch {
      isLocked.value = false
    }
  }

  return { isLocked, fetchLockState }
}
