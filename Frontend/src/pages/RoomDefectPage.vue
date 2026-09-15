<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <q-page class="q-pa-md bg-white" style="padding-bottom: 160px;">
        <!-- Sort + Filter buttons -->
        <div class="row justify-end q-mb-md q-gutter-sm">
          <q-btn-dropdown
            outline
            rounded
            color="primary"
            :icon="sortOrder === 'desc' ? 'arrow_downward' : 'arrow_upward'"
            :label="sortOrder === 'desc' ? t('inspection.roomDefect.sortNewest') : t('inspection.roomDefect.sortOldest')"
            size="sm"
            class="q-px-md text-weight-bold bg-white"
          >
            <q-list>
              <q-item clickable v-close-popup @click="sortOrder = 'desc'">
                <q-item-section>{{ t('inspection.roomDefect.sortNewest') }}</q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="sortOrder = 'asc'">
                <q-item-section>{{ t('inspection.roomDefect.sortOldest') }}</q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>

          <q-btn
            outline
            rounded
            color="primary"
            icon="filter_list"
            :label="t('inspection.roomDefect.filter')"
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
        <div v-if="filteredDefects.length === 0 && pendingCreateCards.length === 0" class="text-center q-py-xl">
          <q-icon name="check_circle" color="positive" size="48px" />
          <div class="text-body2 text-grey-6 q-mt-sm">{{ t('inspection.roomDefect.noDefectsInRoom') }}</div>
        </div>

        <!-- List -->
        <div v-else class="column">
          <div class="column q-gutter-y-md">
            <DefectDetailCard
              v-for="defect in paginatedDefects"
              :key="defect.defectId"
              :defect="toCardData(defect)"
              :sync-status="store.defectSyncState[defect.defectId]?.status"
              :sync-error="store.defectSyncState[defect.defectId]?.error ?? ''"
              @click="onEditDefectClick(defect)"
              @retry="store.retryDefectSync(defect.defectId)"
            />
            <DefectDetailCard
              v-for="pending in pendingCreateCards"
              :key="pending.defectId"
              :defect="toCardData(pending)"
              :sync-status="store.defectSyncState[pending.defectId]?.status"
              :sync-error="store.defectSyncState[pending.defectId]?.error ?? ''"
              @retry="store.retryDefectSync(pending.defectId)"
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
        <ActionFab v-if="!isLocked" @add="onAddDefectClick" />
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
          <span class="text-weight-bold text-body1">{{ t('inspection.roomDefect.filter') }}</span>
          <q-btn flat dense :label="t('inspection.roomDefect.reset')" color="primary" @click="resetFilter" />
        </div>

        <q-separator />

        <div class="q-pa-md column q-gutter-y-lg">
          <!-- สถานะ -->
          <div>
            <div class="text-caption text-grey-6 q-mb-sm text-weight-medium">{{ t('inspection.roomDefect.status') }}</div>
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
            <div class="text-caption text-grey-6 q-mb-sm text-weight-medium">{{ t('inspection.roomDefect.severity') }}</div>
            <div class="row q-gutter-sm">
              <q-btn
                :label="t('inspection.roomDefect.all')"
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
            <div class="text-caption text-grey-6 q-mb-sm text-weight-medium">{{ t('inspection.roomDefect.jobType') }}</div>
            <div class="row q-gutter-sm">
              <q-btn
                :label="t('inspection.roomDefect.all')"
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
                :key="cat.categoryId"
                :label="localizedName(cat)"
                :color="filter.categories.includes(cat.categoryId) ? 'primary' : 'grey-3'"
                :text-color="filter.categories.includes(cat.categoryId) ? 'white' : 'grey-8'"
                unelevated
                rounded
                no-caps
                dense
                class="q-px-md"
                @click="toggle(filter.categories, cat.categoryId)"
              />
            </div>
          </div>

          <!-- สถานะพิกัดแปลน -->
          <div>
            <div class="text-caption text-grey-6 q-mb-sm text-weight-medium">{{ t('inspection.roomDefect.planStatus') }}</div>
            <div class="row q-gutter-sm">
              <q-btn
                :label="t('inspection.roomDefect.all')"
                :color="filter.planStatus === 'all' ? 'primary' : 'grey-3'"
                :text-color="filter.planStatus === 'all' ? 'white' : 'grey-8'"
                unelevated
                rounded
                no-caps
                dense
                class="q-px-md"
                @click="filter.planStatus = 'all'"
              />
              <q-btn
                :label="t('inspection.roomDefect.planStatusPinned')"
                :color="filter.planStatus === 'pinned' ? 'primary' : 'grey-3'"
                :text-color="filter.planStatus === 'pinned' ? 'white' : 'grey-8'"
                unelevated
                rounded
                no-caps
                dense
                class="q-px-md"
                @click="filter.planStatus = 'pinned'"
              />
              <q-btn
                :label="t('inspection.roomDefect.planStatusUnpinned')"
                :color="filter.planStatus === 'unpinned' ? 'warning' : 'grey-3'"
                :text-color="filter.planStatus === 'unpinned' ? 'white' : 'grey-8'"
                unelevated
                rounded
                no-caps
                dense
                class="q-px-md"
                @click="filter.planStatus = 'unpinned'"
              />
            </div>
          </div>
        </div>

        <!-- Apply -->
        <div class="q-pa-md">
          <q-btn
            color="primary"
            :label="t('inspection.roomDefect.apply')"
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
import { useI18n } from 'vue-i18n';

import DefectDetailCard from '../components/DefectDetailCard.vue';
import { useInspectionStore } from 'src/stores/useInspection';
import { useRoundLock } from 'src/composables/useRoundLock';
import { useInspectionRoutes } from 'src/composables/useInspectionRoutes';
import { localizedName } from 'src/composables/useLocalizedField';
import type { Defect } from 'src/models';

// ── Route ─────────────────────────────────────────────────────

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const groupKey = route.query.groupKey as string;

// ── Store ─────────────────────────────────────────────────────

const store = useInspectionStore();
const { isLocked, fetchLockState } = useRoundLock(route.params.roundId as string);
const { addDefectRoute, verifyDefectRoute } = useInspectionRoutes();
void fetchLockState();

// ── Room defects ──────────────────────────────────────────────

const roomDefects = computed<Defect[]>(() => {
  const group = store.groupedDefects.find((g) => g.groupKey === groupKey);
  return group?.defects ?? [];
});

// defect ที่กำลังบันทึกใหม่เบื้องหลัง (ยังไม่มีใน store.defects จนกว่า fetchDefects จะดึงของจริงมา)
// match ด้วย room/subRoom/floor เทียบกับ defect ตัวแรกในกลุ่มนี้ เพราะกลุ่มถูกสร้างจากห้อง/ชั้นเดียวกัน
const pendingCreateCards = computed<Defect[]>(() => {
  const ref = roomDefects.value[0];
  if (!ref) return [];
  return Object.values(store.defectSyncState)
    .filter((entry) => entry.isCreate && entry.previewDefect)
    .map((entry) => entry.previewDefect!)
    .filter(
      (p) =>
        (p.room?.roomId ?? null) === (ref.room?.roomId ?? null) &&
        (p.subRoom?.subRoomId ?? null) === (ref.subRoom?.subRoomId ?? null) &&
        (p.floor?.floorId ?? null) === (ref.floor?.floorId ?? null),
    );
});

// ── Filter state ──────────────────────────────────────────────

const showFilter = ref(false);
const sortOrder = ref<'desc' | 'asc'>('desc'); // desc = ล่าสุด-ช้าสุด, asc = ช้าสุด-ล่าสุด

const filter = ref({
  statuses: [] as string[], // [] = ทั้งหมด
  severities: [] as string[], // [] = ทั้งหมด
  categories: [] as number[], // categoryId, [] = ทั้งหมด (ใช้ id แทนชื่อ กันตัวกรองหลุดตอนสลับภาษา)
  planStatus: 'all',
});

const statusOptions = computed(() => [
  { value: 'all', label: t('inspection.roomDefect.all') },
  { value: 'verified', label: t('inspection.roomDefect.statusVerified') },
  { value: 'not_pass', label: t('inspection.roomDefect.statusNotPass') },
]);

// ── Available options จาก defects จริง ───────────────────────

const availableSeverities = computed(() => [...new Set(roomDefects.value.map((d) => d.severity))]);

const availableCategories = computed(() => {
  const map = new Map<number, NonNullable<Defect['subCategories'][number]['category']>>();
  roomDefects.value.forEach((d) =>
    d.subCategories.forEach((s) => {
      if (s.category) map.set(s.category.categoryId, s.category);
    }),
  );
  return [...map.values()];
});

// ── Active filter count ───────────────────────────────────────

const activeFilterCount = computed(() => {
  let n = 0;
  if (filter.value.statuses.length > 0) n++;
  if (filter.value.severities.length > 0) n++;
  if (filter.value.categories.length > 0) n++;
  if (filter.value.planStatus !== 'all') n++;
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
      d.subCategories.some((s) => s.category && filter.value.categories.includes(s.category.categoryId)),
    );
  }

  // filter plan status
  if (filter.value.planStatus === 'pinned') {
    list = list.filter((d) => Boolean(d.planId || d.plan));
  } else if (filter.value.planStatus === 'unpinned') {
    list = list.filter((d) => !d.planId && !d.plan);
  }

  // เรียงตามเวลาที่บันทึก defect (createdAt)
  list = [...list].sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return sortOrder.value === 'desc' ? bTime - aTime : aTime - bTime;
  });

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
  filter.value = { statuses: [], severities: [], categories: [], planStatus: 'all' };
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
    category: localizedName(d.subCategories[0]?.category) || '-',
    severity: d.severity,
    tags: d.subCategories.map((s) => localizedName(s)),
    status: d.status,
    description: d.description ?? '--',
    plan: d.plan,
    planId: d.planId ?? d.plan?.planId,
    planX: d.planX,
    planY: d.planY,
    locationZone: d.locationZone,
  };
}

// ── Navigation ────────────────────────────────────────────────

import ActionFab from '../components/ActionFab.vue';
const roundId = route.params.roundId as string;
const onAddDefectClick = () => {
  const group = store.groupedDefects.find((g) => g.groupKey === groupKey);
  const defect = group?.defects[0];
  void router.push({
    name: addDefectRoute,
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
      name: verifyDefectRoute,
      params: { roundId },
      query: {
        defectId: defect.defectId,
      },
    });
  } else {
    void router.push({
      name: addDefectRoute,
      params: { roundId },
      query: {
        defectId: defect.defectId,
      },
    });
  }
};
</script>
