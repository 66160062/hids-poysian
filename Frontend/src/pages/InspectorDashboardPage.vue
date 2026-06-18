<template>
  <q-page class="bg-grey-3 row justify-center">
    <div
      class="bg-white relative-position"
      :style="{
        width: '100%',
        maxWidth: isMobile ? '430px' : '800px',
        minHeight: '100vh',
        paddingBottom: '90px',
        boxShadow: '0 0 20px rgba(0, 0, 0, 0.1)',
      }"
    >
      <div class="q-pa-lg" style="max-width: 600px; margin: 20px auto 0">
        <InspectorCalendar
          :rounds="rounds"
          :selectedDate="selectedDate"
          :isMonthlyView="isMonthlyView"
          @update:selectedDate="selectedDate = $event"
          @update:isMonthlyView="onMonthlyViewChange"
          @monthChanged="onMonthChanged"
        />
      </div>

      <q-separator color="primary" class="q-mx-lg q-mb-lg" style="height: 2px" />

      <div class="q-px-lg q-mb-md">
        <div class="row justify-between items-end">
          <div class="text-weight-bold" style="font-size: 16px">รายการงานตรวจ</div>
          <div class="text-weight-bold" style="font-size: 15px">วันที่ {{ selectedDateLabel }}</div>
        </div>
        <div class="text-grey-6 q-mt-xs" style="font-size: 12px">
          สรุป: ตรวจบ้าน {{ filteredDayRounds.length }} งาน
        </div>
      </div>

      <div v-if="loading" class="flex flex-center q-pa-xl">
        <q-spinner color="blue" size="40px" />
      </div>

      <div v-else class="q-px-lg q-mb-xl">
        <div v-if="filteredDayRounds.length === 0" class="text-center text-grey q-pa-xl">
          <div class="text-h6 text-weight-medium">ไม่มีงานตรวจบ้านในวันนี้</div>
          <div v-if="selectedDayRounds.length > 0" class="text-body2 q-mt-sm text-warning" style="font-family: 'Inter', 'Noto Sans Thai', sans-serif;">
            วันนี้มี <span class="text-weight-bold">งานตรวจก่อสร้าง</span>
            <br />
            กดที่เมนูด้านล่างเพื่อสลับโหมด
          </div>
        </div>

        <template v-else>
          <div v-if="morningRounds.length > 0">
            <div class="text-primary text-weight-bold q-mb-sm" style="font-size: 12px">
              รอบเช้า 9:00-12:00
            </div>
            <PropertyCard
              v-for="round in morningRounds"
              :key="'m' + round.roundId"
              :item="round"
              :isMobile="isMobile"
            />
          </div>

          <div v-if="afternoonRounds.length > 0" class="q-mt-lg">
            <div class="text-primary text-weight-bold q-mb-sm" style="font-size: 12px">
              รอบบ่าย 13:00-16:00
            </div>
            <PropertyCard
              v-for="round in afternoonRounds"
              :key="'a' + round.roundId"
              :item="round"
              :isMobile="isMobile"
            />
          </div>
        </template>
      </div>

    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onActivated } from 'vue';
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import { useAuthStore } from 'src/stores/useAuth';
import type { InspectionRound } from 'src/models';
import PropertyCard from '../components/PropertyCard.vue';
import InspectorCalendar from '../components/InspectorCalendar.vue';

// ── Plugins & State ───────────────────────────────────────────
const $q = useQuasar();
const authStore = useAuthStore();
const isMobile = computed(() => $q.screen.lt.md);

const inspectorId = computed(() => authStore.currentUser?.id ?? 0);
const loading = ref(false);
const isMonthlyView = ref(false);
const rounds = ref<InspectionRound[]>([]);
const selectedDate = ref(new Date());
const currentMonth = ref(new Date());

// ── Computed: filter only Defect rounds ───────────────────────
const selectedDayRounds = computed(() => {
  const selected = toLocalDateStr(selectedDate.value);
  return rounds.value.filter((r) => toScheduledDateStr(r.scheduledDate) === selected);
});

const filteredDayRounds = computed(() => {
  return selectedDayRounds.value.filter(
    (r) => r.job?.inspectionType === 'Defect' || r.job?.inspectionType === 'ตรวจ Defect',
  );
});

const morningRounds = computed(() => {
  return filteredDayRounds.value.filter((r) => getBangkokHour(r.scheduledDate) < 12);
});

const afternoonRounds = computed(() => {
  return filteredDayRounds.value.filter((r) => getBangkokHour(r.scheduledDate) >= 12);
});

const selectedDateLabel = computed(() => {
  return selectedDate.value.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
});

// ── Calendar Event Handlers ───────────────────────────────────
function onMonthlyViewChange(value: boolean): void {
  isMonthlyView.value = value;
  void fetchRounds();
}

function onMonthChanged(date: Date): void {
  currentMonth.value = date;
  void fetchRounds();
}

// ── Data Fetching ─────────────────────────────────────────────
async function fetchRounds(): Promise<void> {
  if (!inspectorId.value) {
    rounds.value = [];
    return;
  }

  loading.value = true;
  try {
    const dateParam = isMonthlyView.value
      ? toLocalDateStr(currentMonth.value)
      : toLocalDateStr(selectedDate.value);
    const endpoint = isMonthlyView.value
      ? `/inspection-rounds/month/${inspectorId.value}?date=${dateParam}`
      : `/inspection-rounds/week/${inspectorId.value}?date=${dateParam}`;

    const res = await api.get(endpoint);
    rounds.value = Array.isArray(res.data) ? res.data : [];
  } catch (e: unknown) {
    if (e instanceof Error) {
      console.error('fetchRounds error:', e.message);
    }
    rounds.value = [];
  } finally {
    loading.value = false;
  }
}

// ── Helpers ───────────────────────────────────────────────────
function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function toScheduledDateStr(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
}

function getBangkokHour(dateStr: string): number {
  return Number(
    new Date(dateStr).toLocaleString('en-US', {
      timeZone: 'Asia/Bangkok',
      hour: 'numeric',
      hour12: false,
    }),
  );
}

// ── Lifecycle ─────────────────────────────────────────────────
onMounted(() => {
  void fetchRounds();
});

onActivated(() => {
  void fetchRounds();
});
</script>
