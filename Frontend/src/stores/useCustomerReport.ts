import { reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from 'src/boot/axios'

// ── Types ─────────────────────────────────────────────────────────────────────
export interface ReportField {
  label?:       string
  type:         'radio' | 'checkbox' | 'textarea'
  options?:     string[]
  selected?:    string | string[]
  value?:       string
  placeholder?: string
}

export interface ReportItem {
  heading: string
  fields:  ReportField[]
}

export interface ReportSection {
  title: string
  items: ReportItem[]
}

interface SummaryOptionResponse {
  optionId: number
  value: string
  group?: string
  type: string
}

interface SummaryTemplateResponse {
  templateId: number
  category: string
  label: string
  options: SummaryOptionResponse[]
}

interface SummaryItemResponse {
  itemId: number
  detailValue?: string
  template: { templateId: number }
  option: { optionId: number; value: string; group?: string; type: string } | null
}

type AnswerItemResponse = SummaryItemResponse & { option: NonNullable<SummaryItemResponse['option']> }

interface RoundResponse {
  roundId: number
  roundNumber: number
}

// ── Composable ────────────────────────────────────────────────────────────────
export function useReport() {
  const { t } = useI18n()

  const reportSections = reactive<ReportSection[]>([])
  const isLoading = ref(false)

  async function fetchReport(jobId: number, linkToken?: string | null) {
    isLoading.value = true
    const params = linkToken ? { token: linkToken } : {}
    try {
      const { data: rounds } = await api.get<RoundResponse[]>(`/daily-reports/${jobId}/rounds`, {
        params,
      })
      const latestRound = rounds[rounds.length - 1]
      if (!latestRound) {
        reportSections.splice(0, reportSections.length)
        return
      }

      const [{ data: templates }, { data: items }] = await Promise.all([
        api.get<SummaryTemplateResponse[]>('/summary-templates'),
        api.get<SummaryItemResponse[]>(
          `/inspection-summary-items/round/${latestRound.roundId}`,
          { params },
        ),
      ])

      const sectionsMap = new Map<string, ReportItem[]>()

      for (const template of templates) {
        const groups = new Map<string, SummaryOptionResponse[]>()
        for (const opt of template.options) {
          const groupName = opt.group || template.label
          if (!groups.has(groupName)) groups.set(groupName, [])
          groups.get(groupName)!.push(opt)
        }

        // แถวรูปหลักฐานไม่มี option จึงถูกกรองออกตรงนี้
        const templateItems = items.filter(
          (i): i is AnswerItemResponse => i.template.templateId === template.templateId && i.option !== null,
        )
        const showLabel = groups.size > 1

        const fields: ReportField[] = []
        for (const [groupName, opts] of groups) {
          const type: 'radio' | 'checkbox' = opts[0]?.type === 'checkbox' ? 'checkbox' : 'radio'
          const selectedOptionIds = new Set(
            templateItems
              .filter((i) => (i.option.group || template.label) === groupName)
              .map((i) => i.option.optionId),
          )
          const selectedValues = opts
            .filter((o) => selectedOptionIds.has(o.optionId))
            .map((o) => o.value)

          fields.push({
            ...(showLabel ? { label: groupName } : {}),
            type,
            options: opts.map((o) => o.value),
            ...(type === 'checkbox'
              ? { selected: selectedValues }
              : selectedValues[0] !== undefined
                ? { selected: selectedValues[0] }
                : {}),
          })
        }

        const note = templateItems.find((i) => i.detailValue)?.detailValue
        if (note) {
          fields.push({ label: t('stores.customerReport.note'), type: 'textarea', value: note })
        }

        if (!sectionsMap.has(template.category)) sectionsMap.set(template.category, [])
        sectionsMap.get(template.category)!.push({ heading: template.label, fields })
      }

      const sections = Array.from(sectionsMap.entries()).map(([title, sectionItems]) => ({
        title,
        items: sectionItems,
      }))
      reportSections.splice(0, reportSections.length, ...sections)
    } finally {
      isLoading.value = false
    }
  }

  return {
    reportSections,
    isLoading,
    fetchReport,
  }
}
