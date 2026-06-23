import { ref, computed } from 'vue'
import { api } from 'src/boot/axios'

// circumference ของ circle r=36 → 2π×36 ≈ 226.2
const CIRCUMFERENCE = 226.2

interface DefectSubCategoryResponse {
  subCategoryId: number
  name: string
  category?: { categoryId: number; name: string }
}

interface DefectResponse {
  defectId: number
  status: string
  subCategories?: DefectSubCategoryResponse[]
}

interface RoundResponse {
  roundId: number
}

export function useDefectSummary() {
  const totalDefects = ref(0)
  const inProgress = ref(0)
  const passed = ref(0)
  const jobTypes = ref<{ label: string; count: number }[]>([])
  const isLoading = ref(false)

  async function fetchSummary(jobId: number) {
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

      totalDefects.value = defects.length
      passed.value = defects.filter((d) => d.status === 'PASS').length
      inProgress.value = totalDefects.value - passed.value

      const categoryCounts = new Map<string, number>()
      for (const defect of defects) {
        const categoryNames = new Set(
          (defect.subCategories ?? [])
            .map((sub) => sub.category?.name)
            .filter((name): name is string => !!name),
        )
        for (const name of categoryNames) {
          categoryCounts.set(name, (categoryCounts.get(name) ?? 0) + 1)
        }
      }
      jobTypes.value = Array.from(categoryCounts.entries()).map(([label, count]) => ({
        label,
        count,
      }))
    } finally {
      isLoading.value = false
    }
  }

  // ── Computed ─────────────────────────────────────────────────────────────
  const progressValue = computed(() =>
    totalDefects.value > 0 ? passed.value / totalDefects.value : 0,
  )
  const progressPercent = computed(() => Math.round(progressValue.value * 100))

  // สำหรับ SVG pie chart
  const passedDash = computed(() =>
    totalDefects.value > 0 ? (passed.value / totalDefects.value) * CIRCUMFERENCE : 0,
  )
  const inProgressDash = computed(() =>
    totalDefects.value > 0 ? (inProgress.value / totalDefects.value) * CIRCUMFERENCE : 0,
  )

  return {
    totalDefects,
    inProgress,
    passed,
    jobTypes,
    isLoading,
    progressValue,
    progressPercent,
    passedDash,
    inProgressDash,
    circumference: CIRCUMFERENCE,
    fetchSummary,
  }
}
