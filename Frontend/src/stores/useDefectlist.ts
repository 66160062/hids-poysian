import { ref, computed } from 'vue'
import { api } from 'src/boot/axios'

const API_BASE_URL = import.meta.env.VITE_API_URL as string

// ── Types ────────────────────────────────────────────────────────────────────
export interface DefectItem {
  image:         string
  location:      string
  jobType:       string
  status:        string
  tags:          string[]
  roomName:      string
  categoryNames: string[]
  severity:      string
}

export interface DefectSummary {
  rooms:    number
  jobTypes: number
  total:    number
  passed:   number
  failed:   number
}

interface DefectSubCategoryResponse {
  subCategoryId: number
  name: string
  category?: { categoryId: number; name: string }
}

interface DefectResponse {
  defectId: number
  severity: string
  imageUrl?: string
  status: string
  room?: { roomId: number; roomName: string }
  subRoom?: { subRoomId: number; roomName: string } | null
  floor?: { floorId: number; label: string }
  subCategories?: DefectSubCategoryResponse[]
}

interface RoundResponse {
  roundId: number
}

// ── Composable ───────────────────────────────────────────────────────────────
export function useDefectList() {

  const allDefectItems = ref<DefectItem[]>([])
  const isLoading = ref(false)

  async function fetchDefects(jobId: number) {
    isLoading.value = true
    try {
      const { data: rounds } = await api.get<RoundResponse[]>(`/daily-reports/${jobId}/rounds`)

      const defectLists = await Promise.all(
        rounds.map((round) =>
          api
            .get<DefectResponse[]>(`/defects/round/${round.roundId}`)
            .then((res) => res.data),
        ),
      )
      const defects = defectLists.flat()

      allDefectItems.value = defects.map((defect) => {
        const categoryNames = Array.from(
          new Set(
            (defect.subCategories ?? [])
              .map((sub) => sub.category?.name)
              .filter((name): name is string => !!name),
          ),
        )
        const roomName = defect.room?.roomName || '-'
        const subRoomName = defect.subRoom?.roomName || '-'
        const floorLabel = defect.floor?.label ? `ชั้น${defect.floor.label}` : '-'

        return {
          image: defect.imageUrl
            ? defect.imageUrl.startsWith('http')
              ? defect.imageUrl
              : `${API_BASE_URL}${defect.imageUrl}`
            : '',
          location: `${roomName}, ${subRoomName}, ${floorLabel}`,
          jobType: categoryNames.join(', ') || '-',
          status: defect.status === 'PASS' ? 'ผ่าน' : 'ไม่ผ่าน',
          tags: (defect.subCategories ?? []).map((sub) => sub.name),
          roomName,
          categoryNames,
          severity: defect.severity,
        }
      })
    } finally {
      isLoading.value = false
    }
  }

  // ── Selected filters ──────────────────────────────────────────────────────
  const selectedRooms      = ref<string[]>([])
  const selectedJobTypes   = ref<string[]>([])
  const selectedSeverities = ref<string[]>([])
  const selectedStatuses   = ref<string[]>([])

  // ── Summary ───────────────────────────────────────────────────────────────
  const summary = computed<DefectSummary>(() => {
    const items = allDefectItems.value
    const passed = items.filter((item) => item.status === 'ผ่าน').length
    return {
      rooms:    new Set(items.map((item) => item.roomName)).size,
      jobTypes: new Set(items.flatMap((item) => item.categoryNames)).size,
      total:    items.length,
      passed,
      failed:   items.length - passed,
    }
  })

  // ── Filtered items (reactive ตาม selectedXxx) ─────────────────────────────
  const defectItems = computed(() => {
    return allDefectItems.value.filter(item => {

      const matchRoom = selectedRooms.value.length === 0
        || selectedRooms.value.includes('ทั้งหมด')
        || selectedRooms.value.includes(item.roomName)

      const matchJobType = selectedJobTypes.value.length === 0
        || selectedJobTypes.value.includes('ทั้งหมด')
        || item.categoryNames.some((name) => selectedJobTypes.value.includes(name))

      const matchSeverity = selectedSeverities.value.length === 0
        || selectedSeverities.value.includes('ทั้งหมด')
        || selectedSeverities.value.includes(item.severity)

      const matchStatus = selectedStatuses.value.length === 0
        || selectedStatuses.value.includes(item.status)

      return matchRoom && matchJobType && matchSeverity && matchStatus
    })
  })

  // ── Filter options (มาจากข้อมูลจริงที่ดึงมา) ───────────────────────────────
  const filterRooms = computed(() => [
    'ทั้งหมด',
    ...Array.from(new Set(allDefectItems.value.map((item) => item.roomName))),
  ])
  const filterJobTypes = computed(() => [
    'ทั้งหมด',
    ...Array.from(new Set(allDefectItems.value.flatMap((item) => item.categoryNames))),
  ])
  const filterSeverities = computed(() => [
    'ทั้งหมด',
    ...Array.from(new Set(allDefectItems.value.map((item) => item.severity))),
  ])
  const filterStatuses = ['ผ่าน', 'ไม่ผ่าน']

  // ── Filter actions ────────────────────────────────────────────────────────
  const resetFilter = () => {
    selectedRooms.value      = []
    selectedJobTypes.value   = []
    selectedSeverities.value = []
    selectedStatuses.value   = []
  }

  const applyFilter = () => {
    // defectItems เป็น computed — อัปเดตอัตโนมัติเมื่อ selected เปลี่ยน
  }

  return {
    // data
    summary,
    defectItems,
    isLoading,
    // filter options
    filterRooms,
    filterJobTypes,
    filterSeverities,
    filterStatuses,
    // selected
    selectedRooms,
    selectedJobTypes,
    selectedSeverities,
    selectedStatuses,
    // actions
    resetFilter,
    applyFilter,
    fetchDefects,
  }
}
