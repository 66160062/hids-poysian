import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from 'src/boot/axios';

// ── Types ─────────────────────────────────────────────────────

export interface WorkItemPayload {
  description: string;
  location?: string;
  unit?: string;
  actualPercent?: number;
  plannedPercent?: number;
  remainingPercent?: number;
  note?: string;
  sequence?: number;
}

export interface PersonnelPayload {
  name: string;
  type: 'PERSONNEL' | 'WORKER';
  count: number;
  hours?: number;
}

export interface IssuePayload {
  description: string;
  note?: string;
}

export interface AccidentPayload {
  accidentCount?: number;
  description: string;
}

export interface MachinePayload {
  machineName: string;
  machineSize?: string;
  quantity?: number;
  workingHours?: number;
}

export interface ConstructionDailyReportPayload {
  roundId: number;
  reportDate: string;
  weather?: string;
  workingPeriod?: string;
  contractorName?: string;
  reporterName?: string;
  position?: string;
  workItems?: WorkItemPayload[];
  personnels?: PersonnelPayload[];
  issues?: IssuePayload[];
  accidents?: AccidentPayload[];
  machines?: MachinePayload[];
}

export interface ConstructionDailyReportResponse {
  dailyReportId: number;
  reportDate: string;
  weather: string;
  workingPeriod: string;
  workItems: WorkItemPayload[];
  personnels: PersonnelPayload[];
  issues: IssuePayload[];
  accidents: AccidentPayload[];
  machines: MachinePayload[];
}

// ── Store ─────────────────────────────────────────────────────

export const useConstructionDailyReportStore = defineStore(
  'constructionDailyReport',
  () => {
    const isSubmitting = ref(false);
    const submitError = ref<string | null>(null);

    async function submitReport(
      formData: FormData,
    ): Promise<ConstructionDailyReportResponse> {
      isSubmitting.value = true;
      submitError.value = null;
      try {
        const { data } = await api.post<ConstructionDailyReportResponse>(
          '/construction-daily-reports',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        return data;
      } catch (err) {
        const error = err as { response?: { data?: { message?: string } } };
        submitError.value =
          error.response?.data?.message ?? 'เกิดข้อผิดพลาดในการบันทึกข้อมูล';
        throw err;
      } finally {
        isSubmitting.value = false;
      }
    }

    async function fetchReportByRound(
      roundId: number,
    ): Promise<ConstructionDailyReportResponse | null> {
      try {
        const { data } = await api.get<ConstructionDailyReportResponse>(
          `/construction-daily-reports/round/${roundId}`,
        );
        return data;
      } catch {
        return null;
      }
    }

    return {
      isSubmitting,
      submitError,
      submitReport,
      fetchReportByRound,
    };
  },
);
