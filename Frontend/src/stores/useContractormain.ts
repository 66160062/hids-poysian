import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useRouter } from 'vue-router'

export interface RepairRoom {
  id:     number
  name:   string
  tags:   string[]
  floor:  string
  count:  number
  passed: number
  failed: number
}

export interface DefectItem {
  id:       number
  roomId:   number
  image:    string
  location: string
  jobType:  string
  status:   string
  tags:     string[]
  afterImage?:  string 
  repairNote?:  string
}

export interface RepairStats {
  totalRoomTypes: number
  totalJobTypes:  number
  totalItems:     number
  passed:         number
  failed:         number
}

export interface UpdateRepairPayload {
  status:     string
  afterImage: string
  note:       string
}

export const useContractorRepair = defineStore('contractorRepair', () => {

  const router  = useRouter()
  const search  = ref('')
  const loading = ref(false)
  const error   = ref<string | null>(null)

  // ══════════════════════════════════════════════════════
  //  MOCK DATA — ลบออกตอนร backend
  // ══════════════════════════════════════════════════════
  const stats = ref<RepairStats>({
    totalRoomTypes: 10,
    totalJobTypes:  6,
    totalItems:     30,
    passed:         13,
    failed:         17,
  })

  const rooms = ref<RepairRoom[]>([
    { id: 1,  name: 'ห้องนอนใหญ่, -, ชั้น 1',  tags: ['ห้องนอน'],      floor: 'ชั้น 1', count: 3,  passed: 1, failed: 2 },
    { id: 2,  name: 'ห้องนอนเล็ก, -, ชั้น 1',  tags: ['ห้องนอน'],      floor: 'ชั้น 1', count: 2,  passed: 0, failed: 2 },
    { id: 3,  name: 'ห้องน้ำ (หลัก), ชั้น 1',  tags: ['ห้องน้ำ'],      floor: 'ชั้น 1', count: 4,  passed: 2, failed: 2 },
    { id: 4,  name: 'ห้องน้ำ (รอง), ชั้น 2',   tags: ['ห้องน้ำ'],      floor: 'ชั้น 2', count: 3,  passed: 1, failed: 2 },
    { id: 5,  name: 'ห้องนั่งเล่น, -, ชั้น 1', tags: ['ห้องนั่งเล่น'], floor: 'ชั้น 1', count: 5,  passed: 3, failed: 2 },
    { id: 6,  name: 'ห้องครัว, -, ชั้น 1',     tags: ['ห้องครัว'],     floor: 'ชั้น 1', count: 4,  passed: 2, failed: 2 },
    { id: 7,  name: 'ห้องนอนใหญ่, -, ชั้น 2',  tags: ['ห้องนอน'],      floor: 'ชั้น 2', count: 3,  passed: 2, failed: 1 },
    { id: 8,  name: 'ห้องเก็บของ, -, ชั้น 1',  tags: ['ห้องเก็บของ'],  floor: 'ชั้น 1', count: 2,  passed: 1, failed: 1 },
    { id: 9,  name: 'ระเบียง, -, ชั้น 2',       tags: ['ระเบียง'],      floor: 'ชั้น 2', count: 2,  passed: 0, failed: 2 },
    { id: 10, name: 'ห้องพระ, -, ชั้น 2',       tags: ['ห้องพระ'],      floor: 'ชั้น 2', count: 2,  passed: 1, failed: 1 },
  ])

  const allDefectItems = ref<DefectItem[]>([
    { id: 1,  roomId: 1, image: 'https://placehold.co/160x120/e0e0e0/999?text=Wall',  location: 'ห้องนอนใหญ่, -, ชั้น 1', jobType: 'ผนัง',      status: 'ไม่ผ่าน', tags: ['ผิวไม่เสมอ', 'สีต่าง'] },
    { id: 2,  roomId: 1, image: 'https://placehold.co/160x120/e0e0e0/999?text=Door',  location: 'ห้องนอนใหญ่, -, ชั้น 1', jobType: 'ประตู',     status: 'ไม่ผ่าน', tags: ['บานพับหลวม'] },
    { id: 3,  roomId: 1, image: 'https://placehold.co/160x120/e0e0e0/999?text=Floor', location: 'ห้องนอนใหญ่, -, ชั้น 1', jobType: 'กระเบื้อง', status: 'ผ่าน',    tags: ['ร้าว'] },
    { id: 4,  roomId: 2, image: 'https://placehold.co/160x120/e0e0e0/999?text=Wall',  location: 'ห้องนอนเล็ก, -, ชั้น 1', jobType: 'ผนัง',      status: 'ไม่ผ่าน', tags: ['สีต่าง'] },
    { id: 5,  roomId: 2, image: 'https://placehold.co/160x120/e0e0e0/999?text=Ceil',  location: 'ห้องนอนเล็ก, -, ชั้น 1', jobType: 'ฝ้าเพดาน',  status: 'ไม่ผ่าน', tags: ['แตกร้าว'] },
    { id: 6,  roomId: 3, image: 'https://placehold.co/160x120/e0e0e0/999?text=Floor', location: 'ห้องน้ำ (หลัก), ชั้น 1', jobType: 'กระเบื้อง', status: 'ไม่ผ่าน', tags: ['ยาแนวไม่เต็มร่อง'] },
    { id: 7,  roomId: 3, image: 'https://placehold.co/160x120/e0e0e0/999?text=Pipe',  location: 'ห้องน้ำ (หลัก), ชั้น 1', jobType: 'ประปา',     status: 'ผ่าน',    tags: ['ท่อรั่ว'] },
    { id: 8,  roomId: 3, image: 'https://placehold.co/160x120/e0e0e0/999?text=Wall',  location: 'ห้องน้ำ (หลัก), ชั้น 1', jobType: 'ผนัง',      status: 'ไม่ผ่าน', tags: ['ชื้น', 'ราดำ'] },
    { id: 9,  roomId: 3, image: 'https://placehold.co/160x120/e0e0e0/999?text=Door',  location: 'ห้องน้ำ (หลัก), ชั้น 1', jobType: 'ประตู',     status: 'ผ่าน',    tags: ['บานพับหลวม'] },
    { id: 10, roomId: 4, image: 'https://placehold.co/160x120/e0e0e0/999?text=Floor', location: 'ห้องน้ำ (รอง), ชั้น 2',  jobType: 'กระเบื้อง', status: 'ไม่ผ่าน', tags: ['ร้าว'] },
    { id: 11, roomId: 4, image: 'https://placehold.co/160x120/e0e0e0/999?text=Pipe',  location: 'ห้องน้ำ (รอง), ชั้น 2',  jobType: 'ประปา',     status: 'ผ่าน',    tags: ['ซีลยาง'] },
    { id: 12, roomId: 4, image: 'https://placehold.co/160x120/e0e0e0/999?text=Wall',  location: 'ห้องน้ำ (รอง), ชั้น 2',  jobType: 'ผนัง',      status: 'ไม่ผ่าน', tags: ['สีลอก'] },
    { id: 13, roomId: 5, image: 'https://placehold.co/160x120/e0e0e0/999?text=Wall',  location: 'ห้องนั่งเล่น, -, ชั้น 1',jobType: 'ผนัง',      status: 'ผ่าน',    tags: ['ผิวไม่เสมอ'] },
    { id: 14, roomId: 5, image: 'https://placehold.co/160x120/e0e0e0/999?text=Elec',  location: 'ห้องนั่งเล่น, -, ชั้น 1',jobType: 'ไฟฟ้า',     status: 'ไม่ผ่าน', tags: ['สายไม่เป็นระเบียบ'] },
    { id: 15, roomId: 6, image: 'https://placehold.co/160x120/e0e0e0/999?text=Floor', location: 'ห้องครัว, -, ชั้น 1',    jobType: 'กระเบื้อง', status: 'ไม่ผ่าน', tags: ['ยาแนวแตก'] },
  ])

  // ══════════════════════════════════════════════════════
  //  API INTEGRATION — uncomment backend 
  //    แล้วลบ mock data ด้านบนออก
  // ══════════════════════════════════════════════════════
  // const fetchRepairData = async () => {
  //   try {
  //     loading.value = true
  //     const res  = await fetch('/api/contractor/repair-overview')
  //     const data = await res.json()
  //     stats.value = data.stats
  //     rooms.value = data.rooms
  //   } catch (e) {
  //     error.value = 'โหลดข้อมูลไม่สำเร็จ'
  //   } finally {
  //     loading.value = false
  //   }
  // }

  // const fetchDefectsByRoom = async (roomId: number) => {
  //   try {
  //     loading.value = true
  //     const res  = await fetch(`/api/contractor/defects?roomId=${roomId}`)
  //     const data = await res.json()
  //     allDefectItems.value = data.items
  //   } catch (e) {
  //     error.value = 'โหลดรายการ defect ไม่สำเร็จ'
  //   } finally {
  //     loading.value = false
  //   }
  // }


// ── Update status (ใช้ทั้ง mock และ API)
const updateDefectStatus = (defectId: number, payload: UpdateRepairPayload) => {
  const item = allDefectItems.value.find(d => d.id === defectId)
  if (item) {
    item.status     = payload.status
    item.afterImage = payload.afterImage //  เก็บรูป
    item.repairNote = payload.note       //  เก็บ note
  }

  // ══════════════════════════════════════════════════
  //  uncomment เมื่อ backend พร้อม
  // ══════════════════════════════════════════════════
  // try {
  //   await fetch(`/api/contractor/defects/${defectId}/repair`, {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify(payload)
  //   })
  // } catch (e) {
  //   if (item) item.status = 'ไม่ผ่าน'
  //   error.value = 'บันทึกไม่สำเร็จ กรุณาลองใหม่'
  //   throw e
  // }
}

  // ── Computed & Helpers ────────────────────────────────
  const getDefectsByRoom = (roomId: number) =>
    allDefectItems.value.filter(d => d.roomId === roomId)

  const filteredRooms = computed(() =>
    rooms.value.filter(r =>
      r.name.toLowerCase().includes(search.value.toLowerCase())
    )
  )

  const tagColor = (tag: string): string => {
    const map: Record<string, string> = {
      'ห้องนอน':      'blue',
      'ห้องน้ำ':      'teal',
      'ห้องครัว':     'orange',
      'ห้องนั่งเล่น': 'purple',
      'ห้องเก็บของ':  'brown',
      'ระเบียง':      'cyan',
      'ห้องพระ':      'deep-orange',
    }
    return map[tag] ?? 'grey'
  }

  const goToDefectList = (room: RepairRoom) => {
    void router.push(`/contractor/defect-list/${room.id}`)
  }

  const goToAllDefects = () => {
    void router.push('/contractor/defect-list')
  }

  return {
    search,
    loading,
    error,
    stats,
    rooms,
    filteredRooms,
    tagColor,
    allDefectItems,
    getDefectsByRoom,
    updateDefectStatus,
    goToDefectList,
    goToAllDefects,
  }
})