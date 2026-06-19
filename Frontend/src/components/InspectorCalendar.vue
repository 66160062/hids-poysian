<template>
  <div class="inspector-calendar">
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
      <q-btn flat round icon="chevron_left" @click="handlePrevMonth" />
      <div class="text-weight-bold">
        {{ currentMonth.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' }) }}
      </div>
      <q-btn flat round icon="chevron_right" @click="handleNextMonth" />
    </div>

    <!-- Legend -->
    <div class="row items-center q-gutter-x-md q-mb-sm" style="font-size: 11px">
      <div class="row items-center q-gutter-x-xs">
        <div class="dot-legend" style="background: #1976D2"></div>
        <span class="text-grey-7">ตรวจบ้าน</span>
      </div>
      <div class="row items-center q-gutter-x-xs">
        <div class="dot-legend" style="background: #FF9800"></div>
        <span class="text-grey-7">ตรวจก่อสร้าง</span>
      </div>
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
          @click="handleSelectDay(day)"
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
                    (day.hasDefect || day.hasConstruction) && !day.isActive
                      ? '2px solid #333'
                      : '2px solid transparent',
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
            class="calendar-day-label"
          >
            {{ day.label }}
          </div>
          <div
            class="text-weight-bold q-mt-xs calendar-day-number"
          >
            {{ day.date }}
          </div>

          <!-- Dual dots for weekly view -->
          <div
            v-if="(day.hasDefect || day.hasConstruction) && !isMonthlyView"
            class="absolute-bottom row justify-center q-gutter-x-xs"
            style="margin-bottom: 12px"
          >
            <div
              v-if="day.hasDefect"
              class="calendar-dot"
              :style="{
                background: day.isActive ? '#FFFFFF' : day.dateStr < todayStr ? '#90CAF9' : '#1976D2',
              }"
            ></div>
            <div
              v-if="day.hasConstruction"
              class="calendar-dot"
              :style="{
                background: day.isActive ? '#FFE0B2' : day.dateStr < todayStr ? '#FFCC80' : '#FF9800',
              }"
            ></div>
          </div>

          <!-- Dual dots for monthly view (inside cell) -->
          <div
            v-if="(day.hasDefect || day.hasConstruction) && isMonthlyView"
            class="row justify-center q-gutter-x-xs q-mt-xs"
          >
            <div
              v-if="day.hasDefect"
              class="calendar-dot"
              :style="{
                background: day.isActive ? '#FFFFFF' : '#1976D2',
              }"
            ></div>
            <div
              v-if="day.hasConstruction"
              class="calendar-dot"
              :style="{
                background: day.isActive ? '#FFE0B2' : '#FF9800',
              }"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { InspectionRound } from 'src/models';

// ── Types ─────────────────────────────────────────────────────
interface CalendarDay {
  isEmpty: boolean;
  label?: string;
  date?: number;
  dateStr: string;
  isActive?: boolean;
  hasDefect?: boolean;
  hasConstruction?: boolean;
}

// ── Props & Emits ─────────────────────────────────────────────
interface Props {
  rounds: InspectionRound[];
  selectedDate: Date;
  isMonthlyView: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:selectedDate': [value: Date];
  'update:isMonthlyView': [value: boolean];
  'monthChanged': [value: Date];
}>();

// ── Constants ─────────────────────────────────────────────────
const dayLabels = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];

// ── Internal state for month navigation ───────────────────────
const currentMonth = ref(new Date());

// ── Computed ──────────────────────────────────────────────────
const todayStr = computed(() => toLocalDateStr(new Date()));

const calendarDays = computed<CalendarDay[]>(() => {
  if (!props.isMonthlyView) {
    const startOfWeek = new Date(props.selectedDate);
    startOfWeek.setDate(props.selectedDate.getDate() - props.selectedDate.getDay());

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const dateStr = toLocalDateStr(d);

      const roundsOnDay = props.rounds.filter(
        (r) => toScheduledDateStr(r.scheduledDate) === dateStr,
      );

      return {
        isEmpty: false,
        label: dayLabels[i] ?? '',
        date: d.getDate(),
        dateStr,
        isActive: dateStr === toLocalDateStr(props.selectedDate),
        hasDefect: roundsOnDay.some((r) => isDefectType(r.job?.inspectionType)),
        hasConstruction: roundsOnDay.some((r) => isConstructionType(r.job?.inspectionType)),
      };
    });
  }

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

    const roundsOnDay = props.rounds.filter(
      (r) => toScheduledDateStr(r.scheduledDate) === dateStr,
    );

    days.push({
      isEmpty: false,
      label: dayLabels[currentDate.getDay()] ?? '',
      date: d,
      dateStr,
      isActive: dateStr === toLocalDateStr(props.selectedDate),
      hasDefect: roundsOnDay.some((r) => isDefectType(r.job?.inspectionType)),
      hasConstruction: roundsOnDay.some((r) => isConstructionType(r.job?.inspectionType)),
    });
  }

  return days;
});

// ── Helpers ───────────────────────────────────────────────────
function isDefectType(type: string | undefined): boolean {
  if (!type) return false;
  return type === 'DEFECT_INSPECTION' || type === 'Defect' || type === 'ตรวจ Defect';
}

function isConstructionType(type: string | undefined): boolean {
  if (!type) return false;
  return type === 'CONSTRUCTION_INSPECTION' || type === 'Construction' || type === 'ตรวจก่อสร้าง';
}

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

// ── Event Handlers ────────────────────────────────────────────
function toggleView(): void {
  emit('update:isMonthlyView', !props.isMonthlyView);
}

function handleSelectDay(day: CalendarDay): void {
  if (!day.isEmpty && day.dateStr) {
    emit('update:selectedDate', new Date(`${day.dateStr}T12:00:00`));
  }
}

function handlePrevMonth(): void {
  const d = new Date(currentMonth.value);
  d.setMonth(d.getMonth() - 1);
  currentMonth.value = d;
  emit('update:selectedDate', new Date(d.getFullYear(), d.getMonth(), 1));
  emit('monthChanged', d);
}

function handleNextMonth(): void {
  const d = new Date(currentMonth.value);
  d.setMonth(d.getMonth() + 1);
  currentMonth.value = d;
  emit('update:selectedDate', new Date(d.getFullYear(), d.getMonth(), 1));
  emit('monthChanged', d);
}
</script>

<style scoped>
.inspector-calendar {
  font-family: 'Inter', 'Noto Sans Thai', -apple-system, BlinkMacSystemFont, sans-serif;
}
.calendar-day-label {
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.01em;
}
.calendar-day-number {
  font-size: 24px;
  line-height: 1;
  letter-spacing: -0.02em;
}
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.calendar-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.dot-legend {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
</style>
