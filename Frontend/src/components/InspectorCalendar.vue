<template>
  <div class="inspector-calendar">
    <div class="row justify-between items-center q-mb-md">
      <div class="text-weight-bold" style="font-size: 16px">
        {{ localView ? t('components.inspectorCalendar.monthlyTitle') : t('components.inspectorCalendar.weeklyTitle') }}
      </div>
      <button type="button" class="calendar-toggle-btn" @click="toggleView">
        <q-icon :name="localView ? 'view_week' : 'calendar_view_month'" size="16px" />
        <span>{{ localView ? t('components.inspectorCalendar.switchToWeekly') : t('components.inspectorCalendar.switchToMonthly') }}</span>
      </button>
    </div>

    <!-- Legend -->
    <div class="row items-center q-gutter-x-md q-mb-sm" style="font-size: 11px">
      <div class="row items-center q-gutter-x-xs">
        <div class="dot-legend" style="background: #1976D2"></div>
        <span class="text-grey-7">{{ t('components.inspectorCalendar.legendDefect') }}</span>
      </div>
      <div class="row items-center q-gutter-x-xs">
        <div class="dot-legend" style="background: #FF9800"></div>
        <span class="text-grey-7">{{ t('components.inspectorCalendar.legendConstruction') }}</span>
      </div>
    </div>

    <div ref="gridWrapperEl" class="calendar-grid-transition">
      <div ref="gridContentEl">
        <div v-if="localView" class="row items-center justify-between q-mb-sm">
          <q-btn flat round icon="chevron_left" @click="handlePrevMonth" />
          <div class="text-weight-bold">
            {{ currentMonth.toLocaleDateString(locale, { month: 'long', year: 'numeric' }) }}
          </div>
          <q-btn flat round icon="chevron_right" @click="handleNextMonth" />
        </div>

        <div
          class="hide-scrollbar"
          :class="localView ? 'row wrap' : 'row no-wrap items-start'"
          :style="localView ? '' : 'padding: 10px 0; gap: 4px'"
        >
          <div
            v-for="(day, index) in calendarDays"
            :key="day.dateStr || index"
            :class="localView ? '' : 'column items-center relative-position'"
            :style="
              localView
                ? 'width: 14.28%; padding: 2px;'
                : 'flex: 1 1 0; min-width: 0; border-radius: 14px; padding-top: 14px; height: ' +
                  (day.isActive ? '100px' : '85px') +
                  ';'
            "
          >
            <div v-if="day.isEmpty" style="height: 100%"></div>

            <div
              v-else
              :ref="(el) => setDayCellRef(day.dateStr, el)"
              class="column items-center relative-position full-width full-height cursor-pointer day-cell rounded-borders"
              @click="handleSelectDay(day)"
              :class="[
                day.isActive ? 'is-active' : '',
                day.dateStr < todayStr && !day.isActive ? 'is-past' : '',
              ]"
              :style="[
                localView
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
              <div class="day-cell-content column items-center full-width full-height relative-position">
                <div
                  v-if="!localView"
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
                  v-if="(day.hasDefect || day.hasConstruction) && !localView"
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
                  v-if="(day.hasDefect || day.hasConstruction) && localView"
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
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import type { InspectionRound } from 'src/models';

const { t, locale } = useI18n();

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
const dayLabels = computed(() => [
  t('components.inspectorCalendar.daySun'),
  t('components.inspectorCalendar.dayMon'),
  t('components.inspectorCalendar.dayTue'),
  t('components.inspectorCalendar.dayWed'),
  t('components.inspectorCalendar.dayThu'),
  t('components.inspectorCalendar.dayFri'),
  t('components.inspectorCalendar.daySat'),
]);

// ── Internal state for month navigation ───────────────────────
const currentMonth = ref(new Date());

// Rendering follows this local, deliberately-delayed copy of the prop so the
// grid swap can be timed to happen mid-fade instead of racing Vue's own
// reactive re-render (see the grid resize transition below).
const localView = ref(props.isMonthlyView);

// ── Computed ──────────────────────────────────────────────────
const todayStr = computed(() => toLocalDateStr(new Date()));

const calendarDays = computed<CalendarDay[]>(() => {
  if (!localView.value) {
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
        label: dayLabels.value[i] ?? '',
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
      label: dayLabels.value[currentDate.getDay()] ?? '',
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

// ── Day cell pop animation ─────────────────────────────────────
const dayCellEls: Record<string, HTMLElement> = {};

function setDayCellRef(dateStr: string, el: Element | { $el: Element } | null): void {
  if (el instanceof HTMLElement) dayCellEls[dateStr] = el;
}

const activeDateStr = computed(() => toLocalDateStr(props.selectedDate));

watch(activeDateStr, async (dateStr) => {
  await nextTick();
  const el = dayCellEls[dateStr];
  if (!el) return;
  el.classList.remove('pop');
  void el.offsetWidth;
  el.classList.add('pop');
});

// ── Grid resize transition (weekly ⇄ monthly) ─────────────────
// Morphs the wrapper height directly from its old value to the new one (never
// collapsing to 0 first) while the inner content cross-fades.
const gridWrapperEl = ref<HTMLElement | null>(null);
const gridContentEl = ref<HTMLElement | null>(null);

let gridTransitionToken = 0;

const FADE_OUT_MS = 350;
const FADE_IN_MS = 400;
const HEIGHT_MS = 450;

watch(
  () => props.isMonthlyView,
  async (nextValue) => {
    const wrapper = gridWrapperEl.value;
    const content = gridContentEl.value;
    if (!wrapper || !content) {
      localView.value = nextValue;
      return;
    }

    const token = ++gridTransitionToken;

    const oldHeight = wrapper.offsetHeight;
    wrapper.style.transition = '';
    wrapper.style.overflow = 'hidden';
    wrapper.style.height = `${oldHeight}px`;
    void wrapper.offsetHeight;

    content.style.transition = `opacity ${FADE_OUT_MS}ms ease`;
    content.style.opacity = '0';

    await new Promise<void>((resolve) => setTimeout(resolve, FADE_OUT_MS));
    if (token !== gridTransitionToken) return;

    // Only now do we flip the content itself, so the swap lands exactly at
    // the bottom of the fade-out instead of whenever Vue happens to flush it.
    localView.value = nextValue;
    await nextTick();
    if (token !== gridTransitionToken) return;

    const newHeight = content.scrollHeight;
    wrapper.style.transition = `height ${HEIGHT_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`;
    content.style.transition = `opacity ${FADE_IN_MS}ms ease`;
    requestAnimationFrame(() => {
      wrapper.style.height = `${newHeight}px`;
      content.style.opacity = '1';
    });

    const handler = (e: TransitionEvent): void => {
      if (e.propertyName !== 'height') return;
      wrapper.removeEventListener('transitionend', handler);
      if (token !== gridTransitionToken) return;
      wrapper.style.height = '';
      wrapper.style.overflow = '';
      wrapper.style.transition = '';
    };
    wrapper.addEventListener('transitionend', handler);
  },
);

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
  emit('monthChanged', d);
}

function handleNextMonth(): void {
  const d = new Date(currentMonth.value);
  d.setMonth(d.getMonth() + 1);
  currentMonth.value = d;
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
@media (max-width: 380px) {
  .calendar-day-label {
    font-size: 11px;
  }
  .calendar-day-number {
    font-size: 18px;
  }
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
  transition: background-color 0.4s ease;
}
.day-cell {
  background-color: #ffffff;
  box-shadow: none;
  transition: background-color 0.35s ease, box-shadow 0.4s ease;
}
.day-cell.is-past {
  background-color: #e0e0e0;
}
.day-cell.is-active {
  position: relative;
  z-index: 2;
  background-color: var(--q-primary, #1976d2);
  box-shadow:
    0 1px 5px rgba(0, 0, 0, 0.2),
    0 2px 2px rgba(0, 0, 0, 0.14),
    0 3px 1px -2px rgba(0, 0, 0, 0.12);
}
.day-cell.pop {
  position: relative;
  z-index: 3;
  animation: day-cell-pop 0.32s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes day-cell-pop {
  0% {
    transform: scale(1);
  }
  45% {
    transform: scale(1.12);
  }
  100% {
    transform: scale(1);
  }
}
.day-cell-content {
  z-index: 1;
  color: #1d1d1d;
  transition: color 0.4s ease;
}
.day-cell.is-past .day-cell-content {
  color: #757575;
}
.day-cell.is-active .day-cell-content {
  color: #ffffff;
}
.dot-legend {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.calendar-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: none;
  background: #E3F2FD;
  color: #1976D2;
  font-weight: 700;
  font-size: 13px;
  padding: 6px 12px;
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.15s ease;
}
.calendar-toggle-btn:hover {
  background: #D2E9FC;
}
.calendar-toggle-btn:active {
  background: #BFE0FA;
}
.calendar-grid-transition {
  overflow: hidden;
}
</style>
