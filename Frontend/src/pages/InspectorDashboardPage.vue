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
        <div class="row justify-between items-center q-mb-md">
          <div class="text-weight-bold" style="font-size: 16px">
            {{ isMonthlyView ? 'ตารางงานเดือนนี้' : 'ตารางงานสัปดาห์นี้' }}
          </div>
          <div
            class="text-primary text-weight-bold"
            style="font-size: 13px; cursor: pointer"
            @click="toggleView"
          >
            {{ isMonthlyView ? 'ดูตารางแบบสัปดาห์' : 'ดูตารางงานทั้งหมด' }}
          </div>
        </div>

        <div v-if="isMonthlyView" class="row items-center justify-between q-mb-sm">
          <q-btn flat round icon="chevron_left" @click="prevMonth" />
          <div class="text-weight-bold">
            {{ currentMonth.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' }) }}
          </div>
          <q-btn flat round icon="chevron_right" @click="nextMonth" />
        </div>

        <div
          class="hide-scrollbar"
          :class="isMonthlyView ? 'row wrap' : 'row no-wrap q-gutter-x-sm items-start'"
          :style="isMonthlyView ? '' : 'overflow-x: auto; padding: 10px 0'"
        >
          <div
            v-for="(day, index) in calendarDays"
            :key="day.dateStr || index"
            :class="isMonthlyView ? '' : 'column items-center relative-position'"
            :style="
              isMonthlyView
                ? 'width: 14.28%; padding: 2px;'
                : 'min-width: 68px; border-radius: 14px; padding-top: 14px; height: ' +
                  (day.isActive ? '100px' : '85px') +
                  ';'
            "
          >
            <div v-if="day.isEmpty" style="height: 100%"></div>

            <div
              v-else
              class="column items-center relative-position full-width full-height cursor-pointer"
              @click="selectDay(day)"
              :class="[
                day.isActive
                  ? 'bg-primary text-white shadow-3 rounded-borders'
                  : day.dateStr < todayStr
                    ? 'bg-grey-4 text-grey-6 rounded-borders'
                    : 'bg-white text-dark rounded-borders',
              ]"
              :style="[
                isMonthlyView
                  ? {
                      borderRadius: '12px',
                      padding: '4px 0',
                      border:
                        day.hasDot && !day.isActive ? '2px solid #333' : '2px solid transparent',
                    }
                  : {
                      borderRadius: '14px',
                      border:
                        !day.isActive && day.dateStr > todayStr ? '1px solid #E0E0E0' : 'none',
                    },
              ]"
            >
              <div
                v-if="!isMonthlyView"
                style="font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 500"
              >
                {{ day.label }}
              </div>
              <div
                class="text-weight-bold q-mt-xs"
                style="font-family: 'Inter', sans-serif; font-size: 24px; line-height: 1"
              >
                {{ day.date }}
              </div>
              <div
                v-if="day.hasDot && !isMonthlyView"
                class="absolute-bottom"
                style="
                  width: 6px;
                  height: 6px;
                  border-radius: 50%;
                  margin-bottom: 14px;
                  left: 50%;
                  transform: translateX(-50%);
                "
                :class="
                  day.isActive ? 'bg-white' : day.dateStr < todayStr ? 'bg-grey-5' : 'bg-dark'
                "
              ></div>
            </div>
          </div>
        </div>
      </div>

      <q-separator color="primary" class="q-mx-lg q-mb-lg" style="height: 2px" />

      <div class="q-px-lg q-mb-md">
        <div class="row justify-between items-end">
          <div class="text-weight-bold" style="font-size: 16px">รายการงานตรวจ</div>
          <div class="text-weight-bold" style="font-size: 15px">วันที่ {{ selectedDateLabel }}</div>
        </div>
        <div class="text-grey-6 q-mt-xs" style="font-size: 12px">
          สรุป: ตรวจบ้าน {{ selectedDayRounds.length }} งาน | ตรวจความคืบหน้า (-)
        </div>
      </div>

      <div v-if="loading" class="flex flex-center q-pa-xl">
        <q-spinner color="blue" size="40px" />
      </div>

      <div v-else class="q-px-lg q-mb-xl">
        <div v-if="selectedDayRounds.length === 0" class="text-center text-grey q-pa-xl">
          ไม่มีงานตรวจในวันนี้
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

      <div class="fixed-bottom row justify-center" style="pointer-events: none; z-index: 100">
        <div
          class="bg-white row items-center"
          :style="{
            width: '100%',
            maxWidth: isMobile ? '430px' : '800px',
            height: '75px',
            pointerEvents: 'auto',
            boxShadow: '0 -4px 15px rgba(0, 0, 0, 0.05)',
            borderTop: '1px solid #eee',
          }"
        >
          <div
            @click="activeTab = 'inspection'"
            class="col column items-center justify-center relative-position cursor-pointer h-full"
            style="height: 100%"
          >
            <div
              v-if="activeTab === 'inspection'"
              class="absolute-top bg-primary"
              style="height: 4px; width: 100%"
            ></div>
            <q-icon
              name="engineering"
              size="28px"
              :color="activeTab === 'inspection' ? 'primary' : 'grey-5'"
              class="q-mb-xs"
            />
            <div
              class="text-weight-bold"
              :class="activeTab === 'inspection' ? 'text-primary' : 'text-grey-5'"
              style="font-size: 12px"
            >
              การตรวจบ้าน
            </div>
          </div>

          <div
            @click="activeTab = 'progress'"
            class="col column items-center justify-center relative-position cursor-pointer h-full"
            style="height: 100%"
          >
            <div
              v-if="activeTab === 'progress'"
              class="absolute-top bg-primary"
              style="height: 4px; width: 100%"
            ></div>
            <q-icon
              name="assignment_turned_in"
              size="28px"
              :color="activeTab === 'progress' ? 'primary' : 'grey-5'"
              class="q-mb-xs"
            />
            <div
              class="text-weight-bold"
              :class="activeTab === 'progress' ? 'text-primary' : 'text-grey-5'"
              style="font-size: 12px"
            >
              การตรวจความคืบหน้า
            </div>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import type { InspectionRound } from 'src/models';
import PropertyCard from '../components/PropertyCard.vue';
import { useAuthStore } from 'src/stores/useAuth.js';

interface CalendarDay {
  isEmpty: boolean;
  label?: string;
  date?: number;
  dateStr: string;
  isActive?: boolean;
  hasDot?: boolean;
}

const authStore = useAuthStore();
const inspectorId = ref(authStore.user?.id);

const $q = useQuasar();
const isMobile = computed(() => $q.screen.lt.md);

const activeTab = ref('inspection');
const loading = ref(false);
const isMonthlyView = ref(false);
const rounds = ref<InspectionRound[]>([]);
const selectedDate = ref(new Date());

const dayLabels = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];

// วันที่ปัจจุบันสำหรับเทียบเป็นอดีต/ปัจจุบัน/อนาคต ในปฏิทิน
const todayStr = computed(() => toLocalDateStr(new Date()));

const calendarDays = computed<CalendarDay[]>(() => {
  const today = new Date();

  if (!isMonthlyView.value) {
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const dateStr = toLocalDateStr(d);
      const hasRound = rounds.value.some((r) => toUTCDateStr(r.scheduledDate) === dateStr);

      return {
        isEmpty: false,
        label: dayLabels[i] ?? '',
        date: d.getDate(),
        dateStr: dateStr,
        isActive: dateStr === toLocalDateStr(selectedDate.value),
        hasDot: hasRound,
      };
    });
  } else {
    const days: CalendarDay[] = [];
    const year = currentMonth.value.getFullYear();
    const month = currentMonth.value.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();

    for (let i = 0; i < startPadding; i++) {
      days.push({ isEmpty: true, dateStr: `empty-${i}` });
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const currentDate = new Date(year, month, d);
      const dateStr = toLocalDateStr(currentDate);
      const hasRound = rounds.value.some((r) => toUTCDateStr(r.scheduledDate) === dateStr);

      days.push({
        isEmpty: false,
        label: dayLabels[currentDate.getDay()] ?? '',
        date: d,
        dateStr: dateStr,
        isActive: dateStr === toLocalDateStr(selectedDate.value),
        hasDot: hasRound,
      });
    }
    return days;
  }
});

const selectedDayRounds = computed(() => {
  const selected = toLocalDateStr(selectedDate.value);
  return rounds.value.filter((r) => toUTCDateStr(r.scheduledDate) === selected);
});

const morningRounds = computed(() => {
  return selectedDayRounds.value.filter((r) => {
    const hour = new Date(r.scheduledDate).getUTCHours();
    return hour < 12;
  });
});

const afternoonRounds = computed(() => {
  return selectedDayRounds.value.filter((r) => {
    const hour = new Date(r.scheduledDate).getUTCHours();
    return hour >= 12;
  });
});

const selectedDateLabel = computed(() => {
  return selectedDate.value.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
});

function toggleView() {
  isMonthlyView.value = !isMonthlyView.value;
  void fetchRounds();
}

function selectDay(day: CalendarDay) {
  if (!day.isEmpty && day.dateStr) {
    selectedDate.value = new Date(day.dateStr);
  }
}

async function fetchRounds() {
  loading.value = true;
  try {
    const endpoint = isMonthlyView.value
      ? `/inspection-rounds/month/${inspectorId.value}?date=${toLocalDateStr(currentMonth.value)}`
      : `/inspection-rounds/week/${inspectorId.value}`;
    const res = await api.get(endpoint);
    rounds.value = Array.isArray(res.data) ? res.data : [];
  } catch (e: unknown) {
    if (e instanceof Error) {
      console.log('Message:', e.message);
    }
    rounds.value = [];
  } finally {
    loading.value = false;
  }
}

function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function toUTCDateStr(dateStr: string): string {
  if (!dateStr) return '';
  return String(dateStr).substring(0, 10);
}

const currentMonth = ref(new Date());

function prevMonth() {
  const d = new Date(currentMonth.value);
  d.setMonth(d.getMonth() - 1);
  currentMonth.value = d;
  selectedDate.value = new Date(d.getFullYear(), d.getMonth(), 1);
  void fetchRounds();
}

function nextMonth() {
  const d = new Date(currentMonth.value);
  d.setMonth(d.getMonth() + 1);
  currentMonth.value = d;
  selectedDate.value = new Date(d.getFullYear(), d.getMonth(), 1);
  void fetchRounds();
}

onMounted(() => {
  void fetchRounds();
});
</script>

<style scoped>
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
