จัดให้แบบโค้ดเต็มครบจบในไฟล์เดียวเลยครับ!

ผมได้นำเอาดีไซน์ตามเรฟรูปภาพทั้งหมดมารวมกัน (หน้า Header, ช่องค้นหา, ปุ่ม Filter สีฟ้าทรงแคปซูล และ **การ์ดงานที่มีไอคอนตรงประเภทบ้านและขนาดพื้นที่**) พร้อมทั้งใส่ฟังก์ชันแปลงวันที่ `formatDate` ให้เรียบร้อยครับ

สามารถก๊อปปี้โค้ดด้านล่างนี้ไปวางทับไฟล์ **`AdminWorkPage.vue`** ได้เลยครับ 🚀

```vue
<template>
  <q-page class="admin-work-page bg-white">
    <div class="q-px-md q-pt-lg">

      <div class="row justify-between items-center q-mb-lg">
        <div class="row items-center text-weight-bold text-dark" style="font-size: 20px;">
          <q-icon name="check_circle_outline" color="primary" size="28px" class="q-mr-sm" />
          จัดการงานตรวจ
        </div>
        <div class="row items-center q-gutter-x-sm">
          <q-btn flat round dense icon="notifications_none" color="grey-8" class="bg-grey-2" size="sm" style="width: 36px; height: 36px;" />
          <q-avatar size="36px" color="orange-2" class="cursor-pointer">
            <div style="width: 100%; height: 100%; background-color: #fce4ec; border-radius: 50%;"></div>
          </q-avatar>
        </div>
      </div>

      <div class="row q-mb-md">
        <q-input
          v-model="searchTerm"
          dense
          borderless
          rounded
          placeholder="ค้นหา"
          class="col search-input"
        >
          <template v-slot:prepend>
            <q-icon name="search" color="grey-6" />
          </template>
          <template v-slot:append>
            <q-icon name="tune" color="grey-6" class="cursor-pointer" />
          </template>
        </q-input>
      </div>

      <div class="filter-container q-mb-md">
        <div class="filter-scroll-wrapper no-wrap scroll-x hide-scrollbar row q-gutter-x-sm q-px-none">
          <q-btn
            v-for="filter in filters"
            :key="filter.label"
            unelevated
            rounded
            :class="activeFilter === filter.value ? 'bg-primary text-white' : 'bg-white text-grey-8'"
            class="filter-chip"
            style="border: 1px solid #f0f0f0;"
            no-caps
            @click="activeFilter = filter.value"
          >
            <div class="row no-wrap items-center">
              <span :class="activeFilter === filter.value ? 'text-weight-medium' : ''">{{ filter.label }}</span>
              <q-badge
                v-if="filter.count !== undefined"
                :class="activeFilter === filter.value ? 'bg-white text-primary' : 'bg-grey-2 text-grey-8'"
                class="q-ml-sm count-badge"
              >
                {{ filter.count }}
              </q-badge>
            </div>
          </q-btn>
        </div>
      </div>

      <q-separator color="grey-2" class="q-mb-md" />

      <div class="work-list-wrapper">
        <div class="work-list q-gutter-y-md q-pb-xl">
          <q-card
            v-for="work in filteredWorks"
            :key="work.id"
            flat
            bordered
            class="work-card"
          >
            <q-card-section class="q-pa-md">
              <div class="row justify-between items-start q-mb-sm">
                <div class="text-weight-bold text-dark ellipsis" style="font-size: 16px; max-width: 70%;">
                  {{ work.title }}
                </div>
                <q-badge
                  :class="work.statusBgClass"
                  :text-color="work.statusTextColor"
                  class="status-badge"
                >
                  {{ work.status }}
                </q-badge>
              </div>

              <div class="row q-gutter-x-sm q-mb-md">
                <q-badge class="tag-badge bg-indigo-50 text-indigo-8">
                  <q-icon :name="work.typeIcon || 'home'" size="14px" class="q-mr-xs" />
                  {{ work.type }}
                </q-badge>
                <q-badge class="tag-badge bg-teal-50 text-teal-8">
                  <q-icon name="straighten" size="14px" class="q-mr-xs" />
                  {{ work.area }} ตร.ม.
                </q-badge>
              </div>

              <div class="row items-center q-mb-sm text-grey-7" style="font-size: 13px;">
                <q-icon name="person" size="18px" class="q-mr-sm" />
                <span class="text-dark text-weight-medium">{{ work.inspector || work.team || 'ไม่ระบุ' }}</span>
              </div>
            </q-card-section>

            <q-separator color="grey-2" inset />

            <q-card-actions class="row justify-between items-center q-px-md q-py-sm">
              <div class="text-grey-5 row items-center" style="font-size: 13px;">
                <q-icon name="calendar_today" size="14px" class="q-mr-sm" />
                {{ formatDate(work.date || work.scheduledDate) }}
              </div>
              <div class="row q-gutter-x-sm">
                <q-btn flat round dense icon="visibility" color="grey-6" class="bg-grey-1 action-btn" @click="viewDetail(work)" />
                <q-btn flat round dense icon="edit" color="grey-6" class="bg-grey-1 action-btn" @click="editWork(work)" />
              </div>
            </q-card-actions>
          </q-card>
        </div>
      </div>
    </div>

    <q-page-sticky position="bottom-right" :offset="[18, 18]" style="z-index: 9999">
      <q-btn fab icon="add" color="primary" @click="addNewWork" />
    </q-page-sticky>

  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
// import { useWorkListStore } from '../stores/useWorkList'; // นำกลับมาใช้ได้ถ้าเชื่อม API แล้ว

const router = useRouter();

const searchTerm = ref('');
const activeFilter = ref('all');

// ==========================================
// 🎯 Interface สำหรับข้อมูลงาน
// ==========================================
interface WorkItem {
  id: number;
  title: string;
  type: string;
  typeIcon: string;
  area: number;
  inspector: string;
  team?: string;
  date: string;
  scheduledDate?: string;
  status: string;
  statusKey: string;
  statusBgClass: string;
  statusTextColor: string;
}

// ==========================================
// 🎯 ข้อมูลจำลอง (Mock Data) อิงตามรูปเรฟ
// ==========================================
const works = ref<WorkItem[]>([
  {
    id: 1,
    title: 'บ้านใหญ่พลังชล',
    type: 'คอนโด',
    typeIcon: 'domain',
    area: 33,
    inspector: 'สมชาย ใจดี',
    date: '2026-12-24T00:00:00Z',
    status: 'กำลังดำเนินการ',
    statusKey: 'in_progress',
    statusBgClass: 'bg-orange-1',
    statusTextColor: 'orange-9',
  },
  {
    id: 2,
    title: 'โครงการพฤกษา',
    type: 'ทาวน์เฮาส์',
    typeIcon: 'home_work',
    area: 120,
    inspector: 'นิภา สุขสวัสดิ์',
    date: '2026-12-25T00:00:00Z',
    status: 'กำลังดำเนินการ',
    statusKey: 'in_progress',
    statusBgClass: 'bg-orange-1',
    statusTextColor: 'orange-9',
  },
  {
    id: 3,
    title: 'บ้านสมหวัง',
    type: 'บ้านเดี่ยว',
    typeIcon: 'home',
    area: 150,
    inspector: 'มานี รักบ้าน',
    date: '2026-12-26T00:00:00Z',
    status: 'รอดำเนินการ',
    statusKey: 'waiting',
    statusBgClass: 'bg-grey-2',
    statusTextColor: 'grey-8',
  },
  {
    id: 4,
    title: 'บ้านชายเขา',
    type: 'บ้านเดี่ยว',
    typeIcon: 'home',
    area: 200,
    inspector: 'อรุณี ธรรมศิริ',
    date: '2026-12-27T00:00:00Z',
    status: 'รอดำเนินการ',
    statusKey: 'waiting',
    statusBgClass: 'bg-grey-2',
    statusTextColor: 'grey-8',
  }
]);

// ==========================================
// ฟังก์ชันจัดการวันที่ให้เป็นฟอร์แมต DD/MM/YYYY
// ==========================================
function formatDate(dateStr?: string) {
  if (!dateStr) return 'ไม่ระบุวันที่';
  try {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr; // ถ้าแปลงไม่ได้ ให้โชว์ค่าเดิมไปก่อน
  }
}

// ==========================================
// ลอจิกการ Filter & Search
// ==========================================
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
    { label: 'อื่นๆ', value: 'others', count: counts.others > 0 ? counts.others : undefined },
  ];
});

const filteredWorks = computed(() => {
  let result = works.value;

  // กรองตามปุ่มสถานะ
  if (activeFilter.value !== 'all') {
    result = result.filter((w) => w.statusKey === activeFilter.value);
  }

  // กรองตามช่องค้นหา
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase();
    result = result.filter(
      (w) =>
        w.title.toLowerCase().includes(term) ||
        (w.inspector && w.inspector.toLowerCase().includes(term)) ||
        (w.type && w.type.toLowerCase().includes(term)),
    );
  }

  return result;
});

// ==========================================
// ฟังก์ชันกดปุ่ม Action
// ==========================================
async function viewDetail(work: WorkItem) {
  await router.push(`/admin/work/${work.id}`);
}

async function editWork(work: WorkItem) {
  await router.push(`/admin/work/create?editId=${work.id}`);
}

async function addNewWork() {
  await router.push('/admin/work/create');
}
</script>

<style scoped>
.admin-work-page {
  max-width: 600px;
  margin: 0 auto;
  min-height: 100vh;
}

/* ช่องค้นหาแบบใหม่ */
.search-input {
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  padding: 2px 16px;
  height: 48px;
}

/* คอนเทนเนอร์ของปุ่ม Filter */
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
.hide-scrollbar::-webkit-scrollbar { display: none; }
.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

/* ปุ่ม Filter และ Badge */
.filter-chip {
  min-width: fit-content;
  white-space: nowrap;
  height: 38px;
  padding: 0 16px;
  font-size: 13px;
  transition: all 0.2s ease;
}
.count-badge {
  font-weight: 600;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
}

/* =====================================
   🎯 CSS สำหรับการ์ดงาน (Card)
   ===================================== */
.work-card {
  border-radius: 16px;
  border-color: #f0f0f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
.status-badge {
  font-weight: 600;
  font-size: 11px;
  padding: 6px 12px;
  border-radius: 20px;
}
.tag-badge {
  font-weight: 600;
  font-size: 12px;
  padding: 6px 12px;
  border-radius: 8px;
}
.action-btn {
  width: 36px;
  height: 36px;
}

@media (min-width: 600px) {
  .admin-work-page {
    max-width: 800px;
  }
}
</style>

```
