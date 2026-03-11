import { ref, computed } from 'vue'

// circumference ของ circle r=36 → 2π×36 ≈ 226.2
const CIRCUMFERENCE = 226.2

export function useDefectSummary() {
  // ── Mock data (แก้ตรงนี้จุดเดียวตอนเชื่อม API) ──────────────────────────
  const totalDefects = ref(132)
  const inProgress   = ref(48)
  const passed       = ref(84)

  // ── ตอนเชื่อม backend uncomment ส่วนนี้ แล้วลบ mock ด้านบนออก ───────────
  // const totalDefects = ref(0)
  // const inProgress   = ref(0)
  // const passed       = ref(0)
  //
  // onMounted(async () => {
  //   const res  = await fetch('/api/defects/summary')
  //   const data = await res.json()
  //   totalDefects.value = data.total
  //   inProgress.value   = data.inProgress
  //   passed.value       = data.passed
  // })

  // ── Computed ─────────────────────────────────────────────────────────────
  const progressValue   = computed(() =>
    totalDefects.value > 0 ? passed.value / totalDefects.value : 0
  )
  const progressPercent = computed(() =>
    Math.round(progressValue.value * 100)
  )

  // สำหรับ SVG pie chart
  const passedDash     = computed(() =>
    (passed.value / totalDefects.value) * CIRCUMFERENCE
  )
  const inProgressDash = computed(() =>
    (inProgress.value / totalDefects.value) * CIRCUMFERENCE
  )

  return {
    totalDefects,
    inProgress,
    passed,
    progressValue,
    progressPercent,
    passedDash,
    inProgressDash,
    circumference: CIRCUMFERENCE,
  }
}