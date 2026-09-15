import { ref, computed } from 'vue'
import { api } from 'src/boot/axios'
import { t } from 'src/boot/i18n'
import { localizedName } from 'src/composables/useLocalizedField'

const API_BASE_URL = import.meta.env.VITE_API_URL as string

// ── Types ────────────────────────────────────────────────────────────────────
export interface DefectItem {
  defectId:      number
  image:         string
  location:      string
  jobType:       string
  status:        string   // ข้อความที่แสดง (แปลตามภาษาแล้ว) — ใช้ isPassed ตอนเทียบเงื่อนไข
  isPassed:      boolean
  tags:          string[]
  roomName:      string
  floor:         string
  categoryNames: string[]
  severity:      string
  description:   string
  createdAt:     string
  jobId?:        number
  planId?:       number | null
  planX?:        number | null
  planY?:        number | null
  locationZone?: string | null
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
  nameEn?: string | null
  category?: { categoryId: number; name: string; nameEn?: string | null }
}

interface DefectResponse {
  defectId: number
  severity: string
  description?: string
  imageUrl?: string
  status: string
  createdAt: string
  room?: { roomId: number; roomName: string }
  subRoom?: { subRoomId: number; roomName: string } | null
  floor?: { floorId: number; label: string }
  subCategories?: DefectSubCategoryResponse[]
  planId?: number | null
  planX?: number | null
  planY?: number | null
  locationZone?: string | null
  plan?: { planId: number; name: string; imageUrl: string } | null
}

interface RoundResponse {
  roundId: number
}

// ── Composable ───────────────────────────────────────────────────────────────
export function useDefectList() {

  const allDefectItems = ref<DefectItem[]>([])
  const isLoading = ref(false)

  async function fetchDefects(jobId: number, linkToken?: string | null) {
    isLoading.value = true
    const params = linkToken ? { token: linkToken } : {}
    try {
      const { data: rounds } = await api.get<RoundResponse[]>(`/daily-reports/${jobId}/rounds`, {
        params,
      })

      // rounds มาเรียงตาม roundNumber ASC — เอาเฉพาะรอบล่าสุด ไม่รวมรอบก่อนหน้า
      const latestRound = rounds[rounds.length - 1]
      const { data: defects } = latestRound
        ? await api.get<DefectResponse[]>(`/defects/round/${latestRound.roundId}`, { params })
        : { data: [] as DefectResponse[] }

      allDefectItems.value = defects.map((defect) => {
        const categoryNames = Array.from(
          new Set(
            (defect.subCategories ?? [])
              .map((sub) => localizedName(sub.category))
              .filter((name): name is string => !!name),
          ),
        )
        const roomName = defect.room?.roomName || '-'
        const subRoomName = defect.subRoom?.roomName || '-'
        const floorLabel = defect.floor?.label ? t('stores.defectList.floorPrefix', { label: defect.floor.label }) : '-'

        return {
          defectId: defect.defectId,
          image: defect.imageUrl
            ? defect.imageUrl.startsWith('http')
              ? defect.imageUrl
              : `${API_BASE_URL}${defect.imageUrl}`
            : '',
          location: `${roomName}, ${subRoomName}, ${floorLabel}`,
          jobType: categoryNames.join(', ') || '-',
          status: defect.status === 'verified' ? t('stores.defectList.statusPassed') : t('stores.defectList.statusFailed'),
          isPassed: defect.status === 'verified',
          tags: (defect.subCategories ?? []).map((sub) => localizedName(sub)),
          roomName,
          floor: floorLabel,
          categoryNames,
          severity: defect.severity,
          description: defect.description ?? '',
          createdAt: defect.createdAt,
          jobId,
          planId: defect.planId ?? defect.plan?.planId ?? null,
          planX: defect.planX != null ? Number(defect.planX) : null,
          planY: defect.planY != null ? Number(defect.planY) : null,
          locationZone: defect.locationZone ?? null,
        }
      })
    } finally {
      isLoading.value = false
    }
  }

  // ── Selected filters ──────────────────────────────────────────────────────
  const searchQuery        = ref('')
  const selectedRooms      = ref<string[]>([])
  const selectedFloors     = ref<string[]>([])
  const selectedPlanPosition = ref<string[]>([])
  const selectedJobTypes   = ref<string[]>([])
  const selectedSeverities = ref<string[]>([])
  const selectedStatuses   = ref<string[]>([])
  const sortOrder          = ref<'newest' | 'oldest' | ''>('')

  // ── Summary ───────────────────────────────────────────────────────────────
  const summary = computed<DefectSummary>(() => {
    const items = allDefectItems.value
    const passed = items.filter((item) => item.isPassed).length
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
    const q = searchQuery.value.trim().toLowerCase()
    const allLabel = t('stores.defectList.all')

    const filtered = allDefectItems.value.filter(item => {

      const matchSearch = !q
        || item.location.toLowerCase().includes(q)
        || item.jobType.toLowerCase().includes(q)
        || item.roomName.toLowerCase().includes(q)
        || item.tags.some((tag) => tag.toLowerCase().includes(q))

      const matchRoom = selectedRooms.value.length === 0
        || selectedRooms.value.includes(allLabel)
        || selectedRooms.value.includes(item.roomName)

      const matchFloor = selectedFloors.value.length === 0
        || selectedFloors.value.includes(allLabel)
        || selectedFloors.value.includes(item.floor)

      const matchPlanPosition = selectedPlanPosition.value.length === 0
        || (selectedPlanPosition.value.includes(t('customer.defectList.hasPlanPosition')) && item.planId != null)
        || (selectedPlanPosition.value.includes(t('customer.defectList.noPlanPosition')) && item.planId == null)

      const matchJobType = selectedJobTypes.value.length === 0
        || selectedJobTypes.value.includes(allLabel)
        || item.categoryNames.some((name) => selectedJobTypes.value.includes(name))

      const matchSeverity = selectedSeverities.value.length === 0
        || selectedSeverities.value.includes(allLabel)
        || selectedSeverities.value.includes(item.severity)

      const matchStatus = selectedStatuses.value.length === 0
        || selectedStatuses.value.includes(item.status)

      return matchSearch && matchRoom && matchFloor && matchPlanPosition && matchJobType && matchSeverity && matchStatus
    })

    if (sortOrder.value === 'newest') {
      return [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }
    if (sortOrder.value === 'oldest') {
      return [...filtered].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    }
    return filtered
  })

  // ── Filter options (มาจากข้อมูลจริงที่ดึงมา) ───────────────────────────────
  const filterRooms = computed(() => [
    t('stores.defectList.all'),
    ...Array.from(new Set(allDefectItems.value.map((item) => item.roomName))),
  ])
  const filterFloors = computed(() => [
    t('stores.defectList.all'),
    ...Array.from(new Set(allDefectItems.value.map((item) => item.floor).filter((floor) => floor && floor !== '-'))),
  ])
  const filterJobTypes = computed(() => [
    t('stores.defectList.all'),
    ...Array.from(new Set(allDefectItems.value.flatMap((item) => item.categoryNames))),
  ])
  const filterSeverities = computed(() => [
    t('stores.defectList.all'),
    ...Array.from(new Set(allDefectItems.value.map((item) => item.severity))),
  ])
  const filterStatuses = computed(() => [
    t('stores.defectList.statusPassed'),
    t('stores.defectList.statusFailed'),
  ])
  const filterPlanPosition = computed(() => [
    t('customer.defectList.hasPlanPosition'),
    t('customer.defectList.noPlanPosition'),
  ])

  // ── Filter actions ────────────────────────────────────────────────────────
  const resetFilter = () => {
    selectedRooms.value      = []
    selectedFloors.value     = []
    selectedPlanPosition.value = []
    selectedJobTypes.value   = []
    selectedSeverities.value = []
    selectedStatuses.value   = []
    sortOrder.value          = ''
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
    filterFloors,
    filterPlanPosition,
    filterJobTypes,
    filterSeverities,
    filterStatuses,
    // selected
    searchQuery,
    selectedRooms,
    selectedFloors,
    selectedPlanPosition,
    selectedJobTypes,
    selectedSeverities,
    selectedStatuses,
    sortOrder,
    // actions
    resetFilter,
    applyFilter,
    fetchDefects,
  }
}
