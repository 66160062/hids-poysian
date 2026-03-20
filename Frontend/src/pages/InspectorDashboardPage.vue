<template>
  <q-page class="bg-grey-1 q-pb-xl">
    <div class="bg-white q-pa-md q-mb-sm">
      <div class="row justify-between items-center q-mb-sm">
        <span class="text-weight-bold text-h6">
          {{ isMonthlyView ? 'ตารางงานเดือนนี้' : 'ตารางงานสัปดาห์นี้' }}
        </span>
        <span class="text-blue text-caption cursor-pointer" @click="toggleView">
          {{ isMonthlyView ? 'ดูตารางแบบสัปดาห์' : 'ดูตารางงานทั้งหมด' }}
        </span>
      </div>

      <div v-if="isMonthlyView" class="row text-grey-7 q-mb-sm text-center">
        <div class="col" v-for="dayName in dayLabels" :key="dayName">
          <span class="text-caption">{{ dayName }}</span>
        </div>
      </div>

      <div :class="isMonthlyView ? 'row wrap' : 'row no-wrap scroll q-gutter-sm'">
        <div
          v-for="(day, index) in calendarDays"
          :key="day.dateStr || index"
          :class="isMonthlyView ? '' : 'col-auto'"
          :style="isMonthlyView ? 'width: 14.28%; padding: 2px;' : ''"
        >
          <div v-if="day.isEmpty" style="height: 100%"></div>

          <q-btn
            v-else
            flat
            dense
            :class="day.isActive ? 'bg-blue text-white rounded-borders' : 'bg-grey-2 text-grey-8'"
            :style="
              isMonthlyView
                ? 'width: 100%; border-radius: 12px'
                : 'min-width: 52px; border-radius: 12px'
            "
            @click="selectDay(day)"
          >
            <div class="column items-center q-pa-xs">
              <span v-if="!isMonthlyView" class="text-caption q-mb-xs">{{ day.label }}</span>
              <span class="text-h6 text-weight-bold">{{ day.date }}</span>
              <q-badge
                v-if="day.hasDot"
                :color="day.isActive ? 'white' : 'blue'"
                rounded
                style="width: 12px; height: 6px; padding: 0; margin-top: 2px"
              />
            </div>
          </q-btn>
        </div>
      </div>
    </div>

    <div class="bg-white q-pa-md q-mb-sm">
      <div class="row justify-between items-end">
        <span class="text-weight-bold text-h6">รายการงานตรวจ</span>
        <span class="text-subtitle2 text-black">วันที่ {{ selectedDateLabel }}</span>
      </div>
      <div class="text-caption text-grey-7 q-mt-xs">
        สรุป: ตรวจบ้าน {{ selectedDayRounds.length }} งาน | ตรวจความคืบหน้า (-)
      </div>
    </div>

    <div v-if="loading" class="flex flex-center q-pa-xl">
      <q-spinner color="blue" size="40px" />
    </div>

    <div v-else class="q-px-md q-mb-xl">
      <div v-if="selectedDayRounds.length === 0" class="text-center text-grey q-pa-xl">
        ไม่มีงานตรวจในวันนี้
      </div>

      <template
        v-for="(session, index) in [
          { title: 'รอบเช้า 9:00-12:00', rounds: morningRounds },
          { title: 'รอบบ่าย 13:00-16:00', rounds: afternoonRounds },
        ]"
        :key="index"
      >
        <div v-if="session.rounds.length > 0" class="q-mb-md">
          <div class="text-blue text-weight-bold q-mb-sm">{{ session.title }}</div>

          <q-card
            v-for="round in session.rounds"
            :key="round.roundId"
            flat
            bordered
            class="q-mb-md"
            style="border-color: #1976d2; border-radius: 12px"
            @click="goToDetails(round.roundId)"
          >
            <q-card-section horizontal class="q-pa-sm">
              <q-img
                :src="`http://localhost:3000${round.job.projectImageUrl}`"
                style="width: 120px; height: 130px; border-radius: 8px; object-fit: cover"
              />

              <div class="col q-pl-sm column justify-between">
                <div>
                  <div class="row justify-between items-start q-mb-xs">
                    <span class="text-blue text-weight-bold text-subtitle2">
                      {{ round.job.projectName }}
                    </span>
                    <q-badge
                      color="orange"
                      rounded
                      text-color="white"
                      class="text-caption q-px-sm"
                      style="font-size: 10px"
                    >
                      รอเข้าตรวจ
                    </q-badge>
                  </div>

                  <div class="text-grey-7 text-caption" style="line-height: 1.2; font-size: 11px">
                    เลขที่ {{ round.job.address?.houseNumber }} ถ.{{ round.job.address?.soi }} ต.{{
                      round.job.address?.subDistrict
                    }}
                    อ.{{ round.job.address?.district }} จ.{{ round.job.address?.province }}
                    {{ round.job.address?.postalCode }}
                  </div>

                  <div class="text-black text-weight-medium q-mt-xs" style="font-size: 11px">
                    ประเภทที่อยู่: {{ round.job.houseType?.name }}
                    {{ round.job.address.floor }} ชั้น
                  </div>

                  <div class="row items-center q-mt-xs text-blue">
                    <q-icon name="person_outline" size="14px" class="q-mr-xs" />
                    <span style="font-size: 11px">: {{ round.job.customer?.fullName }}</span>
                  </div>

                  <div class="row items-center text-blue q-mb-xs">
                    <q-icon name="call" size="14px" class="q-mr-xs" />
                    <span style="font-size: 11px">: {{ round.job.customer?.phoneNumber }}</span>
                  </div>
                </div>

                <div class="row justify-between items-end">
                  <q-btn
                    color="blue"
                    icon="map"
                    label="นำทาง"
                    dense
                    unelevated
                    style="border-radius: 8px; font-size: 12px; padding: 2px 12px"
                  />
                  <q-icon name="chevron_right" color="blue" size="20px" />
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </template>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { api } from 'src/boot/axios';
import type { InspectionRound } from 'src/models';
import { useRouter } from 'vue-router';
const router = useRouter();

interface CalendarDay {
  isEmpty: boolean;
  label?: string;
  date?: number;
  dateStr: string;
  isActive?: boolean;
  hasDot?: boolean;
}

const inspectorId = ref(1);
const loading = ref(false);
const isMonthlyView = ref(false);
const rounds = ref<InspectionRound[]>([]);
const selectedDate = ref(new Date());

const dayLabels = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];

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
    const year = today.getFullYear();
    const month = today.getMonth();

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
      ? `/inspection-rounds/month/${inspectorId.value}`
      : `/inspection-rounds/week/${inspectorId.value}`;

    const res = await api.get(endpoint);
    rounds.value = Array.isArray(res.data) ? res.data : [];
  } catch (e) {
    console.error(e);
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

function goToDetails(roundId: number) {
  void router.push(`/inspector/job/${roundId}`);
}

onMounted(() => {
  void fetchRounds();
});
</script>
