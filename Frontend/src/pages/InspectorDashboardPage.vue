<template>
  <q-page class="bg-grey-1">
    <!-- Calendar Strip -->
    <div class="bg-white q-pa-md q-mb-sm">
      <div class="row justify-between items-center q-mb-sm">
        <span class="text-weight-bold">ตารางงานสัปดาห์นี้</span>
        <span class="text-blue text-caption">ดูตารางงานทั้งหมด</span>
      </div>
      <div class="row no-wrap scroll q-gutter-sm">
        <div v-for="day in weekDays" :key="day.dateStr" class="col-auto">
          <q-btn
            flat
            dense
            :class="day.isActive ? 'bg-blue text-white rounded-borders' : 'text-grey'"
            style="min-width: 48px; border-radius: 12px"
            @click="selectDay(day)"
          >
            <div class="column items-center q-pa-xs">
              <span class="text-caption">{{ day.label }}</span>
              <span class="text-h6 text-weight-bold">{{ day.date }}</span>
              <q-badge
                v-if="day.hasDot"
                :color="day.isActive ? 'white' : 'blue'"
                rounded
                style="width: 12px; height: 6px; padding: 0"
              />
            </div>
          </q-btn>
        </div>
      </div>
    </div>

    <!-- Summary -->
    <div class="bg-white q-pa-md q-mb-sm">
      <div class="row justify-between">
        <span class="text-weight-bold">รายการงานตรวจ</span>
        <span class="text-caption text-grey">วันที่ {{ selectedDateLabel }}</span>
      </div>
      <div class="text-caption text-grey">สรุป: ตรวจบ้าน {{ selectedDayRounds.length }} งาน</div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex flex-center q-pa-xl">
      <q-spinner color="blue" size="40px" />
    </div>

    <!-- Jobs List -->
    <div v-else class="q-px-md q-mb-sm">
      <div v-if="selectedDayRounds.length === 0" class="text-center text-grey q-pa-xl">
        ไม่มีงานตรวจในวันนี้
      </div>
      <q-card v-for="round in selectedDayRounds" :key="round.roundId" flat bordered class="q-mb-sm">
        <q-card-section horizontal>
          <q-img
            :src="`http://localhost:3000${round.job.projectImageUrl}`"
            style="width: 100px; height: 100px"
            class="rounded-borders"
          />
          <q-card-section class="q-pa-sm col">
            <div class="row justify-between items-start">
              <span class="text-weight-bold">{{ round.job.projectName }}</span>
              <q-badge color="orange" class="text-caption">{{ round.status }}</q-badge>
            </div>
            <div class="text-caption text-grey q-mt-xs">
              {{ round.job.address?.houseNumber }} {{ round.job.address?.subDistrict }}
              {{ round.job.address?.district }} {{ round.job.address?.province }}
            </div>
            <div class="text-caption text-grey">ประเภทที่อยู่: {{ round.job.houseType?.name }}</div>
            <div class="row items-center q-mt-xs">
              <q-icon name="person" size="14px" class="text-grey q-mr-xs" />
              <span class="text-caption">{{ round.job.customer?.fullName }}</span>
            </div>
            <div class="row items-center">
              <q-icon name="phone" size="14px" class="text-grey q-mr-xs" />
              <span class="text-caption">{{ round.job.customer?.phoneNumber }}</span>
            </div>
            <q-btn
              flat
              dense
              color="blue"
              icon="navigation"
              label="นำทาง"
              class="q-mt-xs"
              size="sm"
            />
          </q-card-section>
          <div class="column justify-center q-pr-sm">
            <q-icon name="chevron_right" color="grey" />
          </div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { api } from 'src/boot/axios';
// import { useAuthStore } from 'src/stores/useAuth';
import type { InspectionRound, WeekDay } from 'src/models';

// const authStore = useAuthStore();
const inspectorId = ref(1);
// const inspectorId = computed(() => authStore.user?.id);

const loading = ref(false);
const rounds = ref<InspectionRound[]>([]);
const selectedDate = ref(new Date());

const dayLabels = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];

const weekDays = computed(() => {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    const dateStr = toLocalDateStr(d);
    const hasRound = rounds.value.some((r) => toUTCDateStr(r.scheduledDate) === dateStr);
    return {
      label: dayLabels[i] ?? '',
      date: d.getDate(),
      dateStr: toLocalDateStr(d) ?? '',
      isActive: dateStr === toLocalDateStr(selectedDate.value),
      hasDot: hasRound,
    };
  });
});

const selectedDayRounds = computed(() => {
  const selected = toLocalDateStr(selectedDate.value);
  return rounds.value.filter((r) => toUTCDateStr(r.scheduledDate) === selected);
});

const selectedDateLabel = computed(() => {
  return selectedDate.value.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
});

function selectDay(day: WeekDay) {
  selectedDate.value = new Date(day.dateStr);
}

async function fetchWeekRounds() {
  loading.value = true;
  try {
    const res = await api.get(`/inspection-rounds/week/${inspectorId.value}`);
    rounds.value = Array.isArray(res.data) ? res.data : [];
    console.log('rounds:', rounds.value);
    console.log('scheduledDate:', rounds.value[0]?.scheduledDate);
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

onMounted(() => {
  void fetchWeekRounds();
});
</script>
