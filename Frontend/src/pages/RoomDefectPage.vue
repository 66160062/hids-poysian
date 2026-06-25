<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <q-page class="q-pa-md bg-white" style="padding-bottom: 160px;">
        <!-- Filter button -->
        <div class="row justify-end q-mb-md">
          <q-btn
            outline
            rounded
            color="primary"
            icon="filter_list"
            label="ตัวกรอง"
            size="sm"
            class="q-px-md text-weight-bold bg-white"
            @click="showFilter = true"
          >
            <q-badge v-if="activeFilterCount > 0" color="primary" floating rounded>
              {{ activeFilterCount }}
            </q-badge>
          </q-btn>
        </div>

        <!-- Empty -->
        <div v-if="filteredDefects.length === 0" class="text-center q-py-xl">
          <q-icon name="check_circle" color="positive" size="48px" />
          <div class="text-body2 text-grey-6 q-mt-sm">ไม่พบรายการ defect ในห้องนี้</div>
        </div>

        <!-- List -->
        <div v-else class="column">
          <div class="column q-gutter-y-md">
            <DefectDetailCard
              v-for="defect in paginatedDefects"
              :key="defect.defectId"
              :defect="toCardData(defect)"
              @click="onEditDefectClick(defect)"
            />
          </div>
          
          <div class="row justify-center q-mt-lg q-mb-md" v-if="totalPages > 1">
            <q-pagination
              v-model="currentPage"
              :max="totalPages"
              color="grey-8"
              active-color="primary"
              active-text-color="white"
              boundary-links
              direction-links
              gutter="sm"
            />
          </div>
        </div>
        <ActionFab @add="onAddDefectClick" />
      </q-page>
    </q-page-container>

    <!-- Filter Bottom Sheet -->
    <q-dialog v-model="showFilter" position="bottom">
      <q-card style="width: 100%; border-radius: 16px 16px 0 0">
        <!-- Handle bar -->
        <div class="row justify-center q-pt-sm q-pb-xs">
          <div style="width: 40px; height: 4px; background: #e0e0e0; border-radius: 99px" />
        </div>

        <!-- Header -->
        <div class="row items-center justify-between q-px-md q-py-sm">
          <span class="text-weight-bold text-body1">ตัวกรอง</span>
          <q-btn flat dense label="รีเซ็ต" color="primary" @click="resetFilter" />
        </div>

        <q-separator />

        <div class="q-pa-md column q-gutter-y-lg">
          <!-- สถานะ -->
          <div>
            <div class="text-caption text-grey-6 q-mb-sm text-weight-medium">สถานะ</div>
            <div class="row q-gutter-sm">
              <q-btn
                v-for="opt in statusOptions"
                :key="opt.value"
                :label="opt.label"
                :color="
                  filter.statuses.length === 0 && opt.value === 'all'
                    ? 'primary'
                    : filter.statuses.includes(opt.value)
                      ? 'primary'
                      : 'grey-3'
                "
                :text-color="
                  filter.statuses.length === 0 && opt.value === 'all'
                    ? 'white'
                    : filter.statuses.includes(opt.value)
                      ? 'white'
                      : 'grey-8'
                "
                unelevated
                rounded
                no-caps
                dense
                class="q-px-md"
                @click="toggleStatus(opt.value)"
              />
            </div>
          </div>

          <!-- ความรุนแรง -->
          <div>
            <div class="text-caption text-grey-6 q-mb-sm text-weight-medium">ความรุนแรง</div>
            <div class="row q-gutter-sm">
              <q-btn
                label="ทั้งหมด"
                :color="filter.severities.length === 0 ? 'primary' : 'grey-3'"
                :text-color="filter.severities.length === 0 ? 'white' : 'grey-8'"
                unelevated
                rounded
                no-caps
                dense
                class="q-px-md"
                @click="filter.severities = []"
              />
              <q-btn
                v-for="opt in availableSeverities"
                :key="opt"
                :label="opt"
                :color="filter.severities.includes(opt) ? severityColor(opt) : 'grey-3'"
                :text-color="filter.severities.includes(opt) ? 'white' : 'grey-8'"
                unelevated
                rounded
                no-caps
                dense
                class="q-px-md"
                @click="toggle(filter.severities, opt)"
              />
            </div>
          </div>

          <!-- ประเภทงาน -->
          <div>
            <div class="text-caption text-grey-6 q-mb-sm text-weight-medium">ประเภทงาน</div>
            <div class="row q-gutter-sm">
              <q-btn
                label="ทั้งหมด"
                :color="filter.categories.length === 0 ? 'primary' : 'grey-3'"
                :text-color="filter.categories.length === 0 ? 'white' : 'grey-8'"
                unelevated
                rounded
                no-caps
                dense
                class="q-px-md"
                @click="filter.categories = []"
              />
              <q-btn
                v-for="cat in availableCategories"
                :key="cat"
                :label="cat"
                :color="filter.categories.includes(cat) ? 'primary' : 'grey-3'"
                :text-color="filter.categories.includes(cat) ? 'white' : 'grey-8'"
                unelevated
                rounded
                no-caps
                dense
                class="q-px-md"
                @click="toggle(filter.categories, cat)"
              />
            </div>
          </div>
        </div>

        <!-- Apply -->
        <div class="q-pa-md">
          <q-btn
            color="primary"
            label="นำไปใช้"
            class="full-width text-weight-bold"
            style="border-radius: 8px; height: 48px"
            @click="showFilter = false"
          />
        </div>
      </q-card>
    </q-dialog>
  </q-layout>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import DefectDetailCard from '../components/DefectDetailCard.vue';
import { useInspectionStore } from 'src/stores/useInspection';
import type { Defect } from 'src/models';

// ── Route ─────────────────────────────────────────────────────

const route = useRoute();
const router = useRouter();
const groupKey = route.query.groupKey as string;

// ── Store ─────────────────────────────────────────────────────

const store = useInspectionStore();

// ── Room defects ──────────────────────────────────────────────

const roomDefects = computed<Defect[]>(() => {
  const group = store.groupedDefects.find((g) => g.groupKey === groupKey);
  return group?.defects ?? [];
});

// ── Filter state ──────────────────────────────────────────────

const showFilter = ref(false);

const filter = ref({
  statuses: [] as string[], // [] = ทั้งหมด
  severities: [] as string[], // [] = ทั้งหมด
  categories: [] as string[], // [] = ทั้งหมด
});

const statusOptions = [
  { value: 'all', label: 'ทั้งหมด' },
  { value: 'verified', label: 'ผ่าน' },
  { value: 'not_pass', label: 'ไม่ผ่าน' },
];

// ── Available options จาก defects จริง ───────────────────────

const availableSeverities = computed(() => [...new Set(roomDefects.value.map((d) => d.severity))]);

const availableCategories = computed(() => [
  ...new Set(
    roomDefects.value
      .flatMap((d) => d.subCategories.map((s) => s.category?.name ?? ''))
      .filter(Boolean),
  ),
]);

// ── Active filter count ───────────────────────────────────────

const activeFilterCount = computed(() => {
  let n = 0;
  if (filter.value.statuses.length > 0) n++;
  if (filter.value.severities.length > 0) n++;
  if (filter.value.categories.length > 0) n++;
  return n;
});

// ── Filtered defects ──────────────────────────────────────────

const filteredDefects = computed(() => {
  let list = roomDefects.value;

  // filter status
  if (filter.value.statuses.length > 0) {
    list = list.filter((d) => {
      if (filter.value.statuses.includes('verified')) return d.status === 'verified';
      if (filter.value.statuses.includes('not_pass')) return d.status !== 'verified';
      return true;
    });
  }

  // filter severity
  if (filter.value.severities.length > 0) {
    list = list.filter((d) => filter.value.severities.includes(d.severity));
  }

  // filter category
  if (filter.value.categories.length > 0) {
    list = list.filter((d) =>
      d.subCategories.some((s) => filter.value.categories.includes(s.category?.name ?? '')),
    );
  }

  return list;
});

const currentPage = ref(1);
const itemsPerPage = 20; // Or whatever is appropriate for inspector, maybe 20
const totalPages = computed(() => Math.ceil(filteredDefects.value.length / itemsPerPage));

const paginatedDefects = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return filteredDefects.value.slice(start, start + itemsPerPage);
});

watch(filteredDefects, () => {
  currentPage.value = 1;
});

// ── Helpers ───────────────────────────────────────────────────

function toggle<T>(arr: T[], val: T) {
  const idx = arr.indexOf(val);
  if (idx === -1) arr.push(val);
  else arr.splice(idx, 1);
}

function toggleStatus(val: string) {
  if (val === 'all') {
    filter.value.statuses = [];
    return;
  }
  filter.value.statuses = [val];
}

function resetFilter() {
  filter.value = { statuses: [], severities: [], categories: [] };
}

function severityColor(s: string): string {
  return { Critical: 'red', Major: 'deep-orange', Minor: 'amber-8' }[s] ?? 'grey';
}

// ── Map Defect → DefectDetailCard props ──────────────────────

function toCardData(d: Defect) {
  const room = d.room?.roomName ?? '-';
  const subRoom = d.subRoom?.roomName ?? '-';
  const floor = d.floor?.label ?? '-';

  return {
    defectId: d.defectId,
    imageUrl: d.imageUrl,
    locationLabel: `${room}, ${subRoom}, ${floor}`,
    category: d.subCategories[0]?.category?.name ?? '-',
    severity: d.severity,
    tags: d.subCategories.map((s) => s.name),
    status: d.status,
    description: d.description ?? '--',
  };
}

// ── Navigation ────────────────────────────────────────────────

import ActionFab from '../components/ActionFab.vue';
const roundId = route.params.roundId as string;
const onAddDefectClick = () => {
  const group = store.groupedDefects.find((g) => g.groupKey === groupKey);
  const defect = group?.defects[0];
  void router.push({
    name: 'addDefect',
    params: { roundId },
    query: {
      roomId: defect?.room?.roomId,
      subRoomId: defect?.subRoom?.subRoomId ?? '',
      floorId: defect?.floor?.floorId,
    },
  });
};

const onEditDefectClick = (defect: Defect) => {
  if (defect.status === 'repaired') {
    void router.push({
      name: 'verifyDefect',
      params: { roundId },
      query: {
        defectId: defect.defectId,
      },
    });
  } else {
    void router.push({
      name: 'addDefect',
      params: { roundId },
      query: {
        defectId: defect.defectId,
      },
    });
  }
};
</script>
