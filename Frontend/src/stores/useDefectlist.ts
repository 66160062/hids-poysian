import { ref, computed } from 'vue'

// ── Types ────────────────────────────────────────────────────────────────────
export interface DefectItem {
  image:    string
  location: string
  jobType:  string
  status:   string
  tags:     string[]
}

export interface DefectSummary {
  rooms:    number
  jobTypes: number
  total:    number
  passed:   number
  failed:   number
}

export interface DefectFilter {
  rooms:      string[]
  jobTypes:   string[]
  severities: string[]
  statuses:   string[]
}

// ── Composable ───────────────────────────────────────────────────────────────
export function useDefectList() {

  // ── Summary (จะมาจาก API) ─────────────────────────────────────────────────
  const summary = ref<DefectSummary>({
    rooms:    9,
    jobTypes: 6,
    total:    132,
    passed:   84,
    failed:   48,
  })

  // ── Defect items source (จะมาจาก API) ────────────────────────────────────
  const allDefectItems = ref<DefectItem[]>([
    { image: 'https://placehold.co/160x120/e0e0e0/999?text=Wall',  location: 'ห้องนั่งเล่น, -, ชั้น1', jobType: 'ผนัง',      status: 'ไม่ผ่าน', tags: ['ผิวไม่เสมอ', 'สีต่าง'] },
    { image: 'https://placehold.co/160x120/e0e0e0/999?text=Wall',  location: 'ห้องนอน, -, ชั้น1',     jobType: 'ผนัง',      status: 'ไม่ผ่าน', tags: ['สีต่าง'] },
    { image: 'https://placehold.co/160x120/e0e0e0/999?text=Floor', location: 'ห้องน้ำ, -, ชั้น2',     jobType: 'กระเบื้อง', status: 'ไม่ผ่าน', tags: ['ร้าว', 'ยาแนวไม่เต็มร่อง'] },
    { image: 'https://placehold.co/160x120/e0e0e0/999?text=Door',  location: 'ห้องนอนใหญ่, -, ชั้น2', jobType: 'ประตู',     status: 'ผ่าน',    tags: ['บานพับหลวม'] },
    { image: 'https://placehold.co/160x120/e0e0e0/999?text=Elec',  location: 'ห้องครัว, -, ชั้น1',    jobType: 'ไฟฟ้า',     status: 'ผ่าน',    tags: ['สายไม่เป็นระเบียบ'] },
  ])

  // ── Filtered items (reactive ตาม selectedXxx) ─────────────────────────────
  const defectItems = computed(() => {
    return allDefectItems.value.filter(item => {

      const matchRoom = selectedRooms.value.length === 0
        || selectedRooms.value.includes('ทั้งหมด')
        || selectedRooms.value.some(r => item.location.startsWith(r.split(',')[0] ?? ''))

      const matchJobType = selectedJobTypes.value.length === 0
        || selectedJobTypes.value.includes('ทั้งหมด')
        || selectedJobTypes.value.includes(item.jobType)

      const matchSeverity = selectedSeverities.value.length === 0
        || selectedSeverities.value.includes('ทั้งหมด')

      const matchStatus = selectedStatuses.value.length === 0
        || selectedStatuses.value.includes(item.status)

      return matchRoom && matchJobType && matchSeverity && matchStatus
    })
  })

  // ── ตอนเชื่อม backend uncomment ส่วนนี้ แล้วลบ mock ด้านบนออก ─────────────
  // const fetchDefects = async (filter?: DefectFilter) => {
  //   const params = new URLSearchParams()
  //   if (filter?.rooms.length)      params.append('rooms',      filter.rooms.join(','))
  //   if (filter?.jobTypes.length)   params.append('jobTypes',   filter.jobTypes.join(','))
  //   if (filter?.severities.length) params.append('severities', filter.severities.join(','))
  //   if (filter?.statuses.length)   params.append('statuses',   filter.statuses.join(','))
  //
  //   const res  = await fetch(`/api/defects?${params}`)
  //   const data = await res.json()
  //   summary.value     = data.summary
  //   defectItems.value = data.items
  // }
  // onMounted(() => fetchDefects())

  // ── Filter options ────────────────────────────────────────────────────────
  const filterRooms      = ['ทั้งหมด', 'ห้องนอนใหญ่', 'ห้องน้ำ', 'ห้องนั่งเล่น', 'ห้องครัว', 'ห้องนอน', 'ห้องเก็บของ', 'ห้องพระ']
  const filterJobTypes   = ['ทั้งหมด', 'ไฟฟ้า', 'ฝาเพดาน', 'ประตู', 'หน้าต่าง', 'กระเบื้อง', 'ผนัง']
  const filterSeverities = ['ทั้งหมด', 'Major', 'Minor']
  const filterStatuses   = ['ผ่าน', 'ไม่ผ่าน']

  // ── Selected filters ──────────────────────────────────────────────────────
  const selectedRooms      = ref<string[]>([])
  const selectedJobTypes   = ref<string[]>([])
  const selectedSeverities = ref<string[]>([])
  const selectedStatuses   = ref<string[]>([])

  // ── Filter actions ────────────────────────────────────────────────────────
  const resetFilter = () => {
    selectedRooms.value      = []
    selectedJobTypes.value   = []
    selectedSeverities.value = []
    selectedStatuses.value   = []
  }

  const applyFilter = () => {
    // defectItems เป็น computed — อัปเดตอัตโนมัติเมื่อ selected เปลี่ยน
    // ตอนเชื่อม backend: เรียก fetchDefects() แทนครับ
  }

  return {
    // data
    summary,
    defectItems,
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
  }
}
