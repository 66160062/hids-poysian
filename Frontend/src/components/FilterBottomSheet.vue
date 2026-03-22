<template>
  <q-dialog v-model="isOpen" position="bottom" @hide="onHide">
    <q-card style="width: 100%; border-radius: 16px 16px 0 0; max-height: 85vh">
      <!-- Handle bar -->
      <div class="row justify-center q-pt-sm q-pb-xs">
        <div style="width: 40px; height: 4px; background: #e0e0e0; border-radius: 99px" />
      </div>

      <!-- Header -->
      <div class="row items-center justify-between q-px-md q-py-sm">
        <span class="text-weight-bold text-body1">กรองและจัดกลุ่ม</span>
        <q-btn flat dense label="รีเซ็ต" color="primary" @click="onReset" />
      </div>

      <q-separator />

      <!-- Content -->
      <q-scroll-area style="height: calc(85vh - 180px)">
        <div class="q-pa-md column q-gutter-y-lg">
          <!-- จัดกลุ่มตาม -->
          <div>
            <div class="text-caption text-grey-6 q-mb-sm text-weight-medium">จัดกลุ่มตาม</div>
            <div class="row q-gutter-sm">
              <q-btn
                v-for="opt in GROUP_BY_OPTIONS"
                :key="opt.value"
                :label="opt.label"
                :color="local.groupBy === opt.value ? 'primary' : 'grey-3'"
                :text-color="local.groupBy === opt.value ? 'white' : 'grey-8'"
                unelevated
                rounded
                no-caps
                dense
                class="q-px-md"
                @click="local.groupBy = opt.value"
              />
            </div>
          </div>

          <!-- ชั้น -->
          <div v-if="availableFloors.length > 0">
            <div class="text-caption text-grey-6 q-mb-sm text-weight-medium">ชั้น</div>
            <div class="row q-gutter-sm">
              <!-- ทั้งหมด -->
              <q-btn
                label="ทั้งหมด"
                :color="local.floors.length === 0 ? 'primary' : 'grey-3'"
                :text-color="local.floors.length === 0 ? 'white' : 'grey-8'"
                unelevated
                rounded
                no-caps
                dense
                class="q-px-md"
                @click="local.floors = []"
              />
              <q-btn
                v-for="f in availableFloors"
                :key="f.value"
                :label="f.label"
                :color="local.floors.includes(f.value) ? 'primary' : 'grey-3'"
                :text-color="local.floors.includes(f.value) ? 'white' : 'grey-8'"
                unelevated
                rounded
                no-caps
                dense
                class="q-px-md"
                @click="toggle(local.floors, f.value)"
              />
            </div>
          </div>

          <!-- ประเภทห้อง -->
          <div v-if="availableRoomTypes.length > 0">
            <div class="text-caption text-grey-6 q-mb-sm text-weight-medium">ประเภทห้อง</div>
            <div class="row q-gutter-sm">
              <!-- ทั้งหมด -->
              <q-btn
                label="ทั้งหมด"
                :color="local.roomTypes.length === 0 ? 'primary' : 'grey-3'"
                :text-color="local.roomTypes.length === 0 ? 'white' : 'grey-8'"
                unelevated
                rounded
                no-caps
                dense
                class="q-px-md"
                @click="local.roomTypes = []"
              />
              <q-btn
                v-for="type in availableRoomTypes"
                :key="type"
                :label="type"
                :color="local.roomTypes.includes(type) ? 'primary' : 'grey-3'"
                :text-color="local.roomTypes.includes(type) ? 'white' : 'grey-8'"
                unelevated
                rounded
                no-caps
                dense
                class="q-px-md"
                @click="toggle(local.roomTypes, type)"
              />
            </div>
          </div>

          <!-- ความรุนแรง -->
          <div v-if="availableSeverityLevels.length > 0">
            <div class="text-caption text-grey-6 q-mb-sm text-weight-medium">ความรุนแรง</div>
            <div class="row q-gutter-sm">
              <!-- ทั้งหมด -->
              <q-btn
                label="ทั้งหมด"
                :color="local.severityLevels.length === 0 ? 'primary' : 'grey-3'"
                :text-color="local.severityLevels.length === 0 ? 'white' : 'grey-8'"
                unelevated
                rounded
                no-caps
                dense
                class="q-px-md"
                @click="local.severityLevels = []"
              />
              <q-btn
                v-for="sv in availableSeverityLevels"
                :key="sv.value"
                :label="sv.label"
                :color="
                  local.severityLevels.includes(sv.value) ? severityColor(sv.value) : 'grey-3'
                "
                :text-color="local.severityLevels.includes(sv.value) ? 'white' : 'grey-8'"
                unelevated
                rounded
                no-caps
                dense
                class="q-px-md"
                @click="toggle(local.severityLevels, sv.value)"
              />
            </div>
          </div>
        </div>
      </q-scroll-area>

      <!-- Apply -->
      <div class="q-pa-md">
        <q-btn
          color="primary"
          label="นำไปใช้"
          class="full-width text-weight-bold"
          style="border-radius: 8px; height: 48px"
          @click="onApply"
        />
      </div>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import type { FilterState, GroupByMode } from 'src/stores/useInspection';
import { ref, watch } from 'vue';

const props = defineProps<{
  modelValue: boolean;
  currentFilter: FilterState;
  availableFloors: { value: string; label: string }[];
  availableRoomTypes: string[];
  availableSeverityLevels: { value: string; label: string }[];
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
  (e: 'apply', filter: FilterState): void;
  (e: 'reset'): void;
}>();

const GROUP_BY_OPTIONS: { value: GroupByMode; label: string }[] = [
  { value: 'room_type', label: 'ประเภทห้อง' },
  { value: 'floor', label: 'ชั้น' },
  { value: 'severity', label: 'ความรุนแรง' },
];

const SEVERITY_COLOR: Record<string, string> = {
  low: 'teal',
  medium: 'orange',
  high: 'deep-orange',
  critical: 'red',
  Major: 'deep-orange',
  Minor: 'orange',
  Critical: 'red',
};

const isOpen = ref(props.modelValue);
const local = ref<FilterState>(cloneFilter(props.currentFilter));

function cloneFilter(f: FilterState): FilterState {
  return {
    groupBy: f.groupBy,
    floors: [...f.floors],
    roomTypes: [...f.roomTypes],
    severityLevels: [...f.severityLevels],
  };
}

watch(
  () => props.modelValue,
  (val) => {
    isOpen.value = val;
    if (val) local.value = cloneFilter(props.currentFilter);
  },
);

watch(isOpen, (val) => emit('update:modelValue', val));

function toggle<T>(arr: T[], val: T) {
  const idx = arr.indexOf(val);
  if (idx === -1) arr.push(val);
  else arr.splice(idx, 1);
}

function severityColor(level: string): string {
  return SEVERITY_COLOR[level] ?? 'primary';
}

function onApply() {
  emit('apply', cloneFilter(local.value));
  isOpen.value = false;
}

function onReset() {
  local.value = { groupBy: 'room_type', floors: [], roomTypes: [], severityLevels: [] };
  emit('reset');
}

function onHide() {
  emit('update:modelValue', false);
}
</script>
