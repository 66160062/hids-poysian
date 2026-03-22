<template>
  <q-page class="admin-work-page bg-grey-1">
    <div class="q-px-md q-pt-md">
      <!-- Search Bar -->
      <div class="row q-mb-md">
        <q-input
          v-model="searchTerm"
          dense
          outlined
          rounded
          hide-bottom-space
          placeholder="ค้นหา"
          class="col bg-white"
        >
          <template v-slot:prepend>
            <q-icon name="search" />
          </template>
          <!-- <template v-slot:append>
            <q-btn flat round dense icon="tune" class="text-grey-6" />
          </template> -->
        </q-input>
      </div>

      <!-- Filter Bar -->
      <div class="filter-container q-mt-md q-mb-lg">
        <div
          class="filter-scroll-wrapper no-wrap scroll-x hide-scrollbar row q-gutter-x-sm q-px-none"
        >
          <q-btn
            v-for="filter in filters"
            :key="filter.label"
            unelevated
            rounded
            :color="activeFilter === filter.value ? 'primary' : 'white'"
            :text-color="activeFilter === filter.value ? 'white' : 'grey-7'"
            class="filter-chip"
            no-caps
            @click="activeFilter = filter.value"
          >
            <div class="row no-wrap items-center">
              <span>{{ filter.label }}</span>
              <q-badge
                v-if="filter.count"
                :color="activeFilter === filter.value ? 'white' : 'grey-2'"
                :text-color="activeFilter === filter.value ? 'primary' : 'grey-8'"
                class="q-ml-sm count-badge"
              >
                {{ filter.count }}
              </q-badge>
            </div>
          </q-btn>
        </div>
      </div>

      <!-- Work List -->
      <div class="work-list-wrapper">
        <div class="work-list q-gutter-y-md">
          <SwipeableWorkCard
            v-for="work in filteredWorks"
            :key="work.id"
            :work="work"
            :is-open="openCardId === work.id"
            @interaction-start="handleInteractionStart(work.id)"
            @open="openCardId = work.id"
            @close="openCardId === work.id ? (openCardId = null) : null"
            @delete="onDelete"
            @edit="editWork"
            @click="viewDetail"
          />
        </div>
      </div>
    </div>

    <!-- Floating Action Button -->
    <q-page-sticky position="bottom-right" :offset="[18, 18]" style="z-index: 9999">
      <q-btn fab icon="add" color="primary" @click="addNewWork" />
    </q-page-sticky>

    <!-- Dialog Placeholder -->
    <q-dialog v-model="showDialog">
      <q-card style="min-width: 300px">
        <q-card-section>
          <div class="text-h6">{{ dialogTitle }}</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          {{ dialogMessage }}
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="ปิด" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import SwipeableWorkCard from '../components/SwipeableWorkCard.vue';
import type { Work } from '../components/SwipeableWorkCard.vue';
import { useWorkListStore } from '../stores/useWorkList';

const router = useRouter();
const $q = useQuasar();
const workStore = useWorkListStore();
const searchTerm = ref('');
const activeFilter = ref('all');
const showDialog = ref(false);
const dialogTitle = ref('');
const dialogMessage = ref('');

const openCardId = ref<number | null>(null);

function handleInteractionStart(id: number) {
  if (openCardId.value && openCardId.value !== id) {
    openCardId.value = null;
  }
}

const filters = computed(() => {
  const counts = {
    all: works.value.length,
    in_progress: works.value.filter((w) => w.statusKey === 'in_progress').length,
    waiting: works.value.filter((w) => w.statusKey === 'waiting').length,
    others: works.value.filter((w) => w.statusKey === 'others').length,
  };

  return [
    { label: 'ทั้งหมด', value: 'all', count: counts.all },
    { label: 'กำลังดำเนินการ', value: 'in_progress', count: counts.in_progress },
    { label: 'รอดำเนินการ', value: 'waiting', count: counts.waiting },
    { label: 'เสร็จสิ้น', value: 'others', count: counts.others },
  ];
});

const works = computed(() => workStore.works);

const STATUS_ORDER: Record<string, number> = {
  in_progress: 0,
  waiting: 1,
  others: 2,
};

const filteredWorks = computed(() => {
  let result = works.value;

  if (activeFilter.value !== 'all') {
    result = result.filter((w) => w.statusKey === activeFilter.value);
  }

  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase();
    result = result.filter(
      (w) =>
        w.title.toLowerCase().includes(term) ||
        w.inspector.toLowerCase().includes(term) ||
        w.type.toLowerCase().includes(term),
    );
  }

  // เรียงลำดับตามสถานะ: กำลังดำเนินการ → รอดำเนินการ → เสร็จสิ้น
  return [...result].sort(
    (a, b) => (STATUS_ORDER[a.statusKey] ?? 99) - (STATUS_ORDER[b.statusKey] ?? 99),
  );
});

async function viewDetail(work: Work) {
  await router.push(`/admin/work/${work.id}`);
}

function editWork(work: Work) {
  dialogTitle.value = 'แก้ไขงาน';
  dialogMessage.value = `คุณต้องการแก้ไขงาน: ${work.title}`;
  showDialog.value = true;
}

async function addNewWork() {
  await router.push('/admin/work/create');
}

function onDelete(work: Work) {
  $q.dialog({
    title: 'ยืนยันการลบ',
    message: `คุณต้องการลบงาน "${work.title}" หรือไม่?`,
    cancel: true,
    persistent: true,
  })
    .onOk(() => {
      openCardId.value = null;

      setTimeout(() => {
        workStore.removeWork(work.id);

        $q.notify({
          message: 'ลบรายการสำเร็จ',
          color: 'negative',
          icon: 'delete',
          position: 'top',
        });
      }, 200);
    })
    .onCancel(() => {
      openCardId.value = null;
    });
}
</script>

<style scoped>
.admin-work-page {
  max-width: 600px;
  margin: 0 auto;
  padding-bottom: 80px;
  width: 100%;
}

.work-list-wrapper {
  overflow-x: clip;
  width: 100%;
}

.filter-container {
  overflow: hidden;
  margin-left: -16px;
  margin-right: -16px;
  width: calc(100% + 32px);
}

.filter-scroll-wrapper {
  padding: 4px 16px;
  overflow-x: auto;
  display: flex;
}

.filter-chip {
  min-width: fit-content;
  white-space: nowrap;
  border: 1px solid #f0f0f0;
  height: 40px;
  padding: 0 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.count-badge {
  border-radius: 10px;
  padding: 2px 8px;
  font-weight: 600;
  font-size: 11px;
}

@media (min-width: 600px) {
  .admin-work-page {
    max-width: 800px;
  }
}
</style>
