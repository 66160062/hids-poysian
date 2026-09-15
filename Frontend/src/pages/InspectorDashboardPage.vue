<template>
  <q-page class="inspector-dashboard-page bg-grey-1">
    <div class="q-pa-md">
      <div class="bg-white q-pa-md calendar-card">
        <InspectorCalendar
          :rounds="rounds"
          :selectedDate="selectedDate"
          :isMonthlyView="isMonthlyView"
          @update:selectedDate="selectedDate = $event"
          @update:isMonthlyView="onMonthlyViewChange"
          @monthChanged="onMonthChanged"
        />
      </div>
    </div>

    <div class="q-px-md q-mb-md">
      <div class="row justify-between items-center">
        <div class="text-weight-bold" style="font-size: 16px">{{ t('inspector.dashboard.title') }}</div>
        <div class="date-chip">
          <q-icon name="event" size="14px" />
          <span>{{ t('inspector.dashboard.dateLabel', { date: selectedDateLabel }) }}</span>
        </div>
      </div>
      <div class="text-grey-6 q-mt-xs" style="font-size: 12px">
        {{ t('inspector.dashboard.summary', { count: filteredDayRounds.length }) }}
      </div>
    </div>

    <!-- Loading State: แสดงผ่าน $q.loading แบบเต็มจอ (ดู onMounted) เว้นพื้นที่ไว้กันเลย์เอาต์กระโดด -->
    <div v-if="loading" style="min-height: 60vh"></div>

    <div v-else class="q-px-md q-mb-xl">
      <div v-if="filteredDayRounds.length === 0" class="text-center text-grey q-pa-xl">
        <div class="text-h6 text-weight-medium">{{ t('inspector.dashboard.noJobsToday') }}</div>
        <div v-if="selectedDayRounds.length > 0" class="text-body2 q-mt-sm text-warning" style="font-family: 'Inter', 'Noto Sans Thai', sans-serif;">
          {{ t('inspector.dashboard.constructionHintPrefix') }} <span class="text-weight-bold">{{ t('inspector.dashboard.constructionHintBold') }}</span>
          <br />
          {{ t('inspector.dashboard.constructionHintSuffix') }}
        </div>
      </div>

      <template v-else>
        <div v-if="morningRounds.length > 0">
          <div class="text-primary text-weight-bold q-mb-sm" style="font-size: 12px">
            {{ t('inspector.dashboard.morningSlot') }}
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
            {{ t('inspector.dashboard.afternoonSlot') }}
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
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onActivated } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { api } from 'src/boot/axios';
import { useAuthStore } from 'src/stores/useAuth';
import type { InspectionRound } from 'src/models';
import PropertyCard from '../components/PropertyCard.vue';
import InspectorCalendar from '../components/InspectorCalendar.vue';
import { createIconSpinner } from 'src/composables/useIconSpinner';

const inspectDashboardSpinner = createIconSpinner('engineering');

// ── Plugins & State ───────────────────────────────────────────
const $q = useQuasar();
const { t, locale } = useI18n();
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
    (r) => r.job?.inspectionType === 'DEFECT_INSPECTION' || r.job?.inspectionType === 'Defect' || r.job?.inspectionType === 'ตรวจ Defect',
  );
});

const morningRounds = computed(() => {
  return filteredDayRounds.value.filter((r) => getBangkokHour(r.scheduledDate) < 12);
});

const afternoonRounds = computed(() => {
  return filteredDayRounds.value.filter((r) => getBangkokHour(r.scheduledDate) >= 12);
});

const selectedDateLabel = computed(() => {
  return selectedDate.value.toLocaleDateString(locale.value, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
});

// ── Calendar Event Handlers ───────────────────────────────────
function onMonthlyViewChange(value: boolean): void {
  isMonthlyView.value = value;
  void fetchRounds(false);
}

function onMonthChanged(date: Date): void {
  currentMonth.value = date;
  void fetchRounds(false);
}

// ── Data Fetching ─────────────────────────────────────────────
// รอบเดือนที่เคยโหลดแล้วจะถูกแคชไว้ + พรีเฟตช์เดือนก่อน/หลังล่วงหน้าเงียบ ๆ
// เพื่อให้กดเปลี่ยนเดือนแล้วเห็นผลทันทีโดยไม่ต้องรอ fetch ทุกครั้ง
const monthCache = new Map<string, InspectionRound[]>();

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

async function fetchRounds(showLoading = true): Promise<void> {
  if (!inspectorId.value) {
    rounds.value = [];
    return;
  }

  if (isMonthlyView.value) {
    const cached = monthCache.get(monthKey(currentMonth.value));
    if (cached) {
      rounds.value = cached;
      void prefetchAdjacentMonths(currentMonth.value);
      return;
    }
  }

  if (showLoading) {
    loading.value = true;
    $q.loading.show({
      spinner: inspectDashboardSpinner,
      spinnerColor: 'primary',
      spinnerSize: 70,
      backgroundColor: 'white',
    });
  }
  try {
    const dateParam = isMonthlyView.value
      ? toLocalDateStr(currentMonth.value)
      : toLocalDateStr(selectedDate.value);
    const endpoint = isMonthlyView.value
      ? `/inspection-rounds/month/${inspectorId.value}?date=${dateParam}`
      : `/inspection-rounds/week/${inspectorId.value}?date=${dateParam}`;

    const res = await api.get(endpoint);
    const data = Array.isArray(res.data) ? res.data : [];
    rounds.value = data;

    if (isMonthlyView.value) {
      monthCache.set(monthKey(currentMonth.value), data);
      void prefetchAdjacentMonths(currentMonth.value);
    }
  } catch (e: unknown) {
    if (e instanceof Error) {
      console.error('fetchRounds error:', e.message);
    }
    rounds.value = [];
  } finally {
    if (showLoading) {
      loading.value = false;
      $q.loading.hide();
    }
  }
}

async function prefetchAdjacentMonths(base: Date): Promise<void> {
  if (!inspectorId.value) return;

  const prev = new Date(base);
  prev.setMonth(prev.getMonth() - 1);
  const next = new Date(base);
  next.setMonth(next.getMonth() + 1);

  await Promise.all(
    [prev, next].map(async (monthDate) => {
      const key = monthKey(monthDate);
      if (monthCache.has(key)) return;
      try {
        const res = await api.get(
          `/inspection-rounds/month/${inspectorId.value}?date=${toLocalDateStr(monthDate)}`,
        );
        monthCache.set(key, Array.isArray(res.data) ? res.data : []);
      } catch {
        // เงียบไว้ — ถ้าพลาดก็แค่ไปโหลดใหม่ตอนผู้ใช้เลื่อนไปเดือนนั้นจริง ๆ
      }
    }),
  );
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
  try {
    return new Date(dateStr).toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
  } catch {
    const tPart = dateStr.split('T')[0];
    return tPart ? (tPart.split(' ')[0] || '') : '';
  }
}

function getBangkokHour(dateStr: string): number {
  if (!dateStr) return 0;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 0;
    const timeStr = d.toLocaleTimeString('en-GB', { timeZone: 'Asia/Bangkok' });
    const hourPart = timeStr.split(':')[0];
    const hour = parseInt(hourPart || '', 10);
    return isNaN(hour) ? d.getHours() : hour;
  } catch {
    return new Date(dateStr).getHours();
  }
}

// ── Lifecycle ─────────────────────────────────────────────────
onMounted(() => {
  void fetchRounds();
});

onActivated(() => {
  void fetchRounds();
});
</script>

<style scoped>
.inspector-dashboard-page {
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  max-width: 480px;
  margin: 0 auto;
  width: 100%;
  min-height: 100vh;
  padding-bottom: 90px;
}

.calendar-card {
  border-radius: 12px;
  border: 1px solid #e0e0e0;
}

.date-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #F5F5F5;
  color: #424242;
  font-weight: 700;
  font-size: 13px;
  padding: 4px 10px;
  border-radius: 999px;
}

@media (min-width: 768px) {
  .inspector-dashboard-page {
    max-width: 720px;
  }
}

@media (min-width: 1024px) {
  .inspector-dashboard-page {
    max-width: 1100px;
  }
}

@media (min-width: 1440px) {
  .inspector-dashboard-page {
    max-width: 1280px;
  }
}
</style>
