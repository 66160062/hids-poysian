<template>
  <q-layout view="lHh Lpr lFf" class="bg-grey-1">
    <q-header class="bg-white text-dark">
      <q-toolbar class="q-px-sm">
        <q-btn
          flat
          dense
          no-caps
          icon="chevron_left"
          label="กลับ"
          color="primary"
          class="text-weight-medium"
          @click="router.back"
        />
        <q-space />
        <q-toolbar-title class="text-center text-weight-bold text-body1 absolute-center">
          การแจ้งเตือนทั้งหมด
        </q-toolbar-title>
        <q-space />
        <q-btn
          flat
          color="primary"
          label="อ่านทั้งหมด"
          class="text-weight-bold"
          @click="markAllAsRead"
        />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <q-page class="admin-notifications-page bg-grey-1">
        <div class="q-px-md q-pt-lg">

          <!-- Search Input -->
          <div class="row q-mb-sm">
            <q-input
              v-model="searchTerm"
              dense
              borderless
              rounded
              placeholder="ค้นหาการแจ้งเตือน..."
              class="col search-input"
            >
              <template v-slot:prepend>
                <q-icon name="search" color="grey-6" />
              </template>
            </q-input>
          </div>

          <!-- Filters: Type & Sort -->
          <div class="row q-col-gutter-sm q-mb-md">
            <div class="col-6">
              <q-select
                v-model="selectedType"
                :options="typeOptions"
                dense
                outlined
                rounded
                bg-color="white"
                class="filter-select"
                behavior="menu"
              >
                <template v-slot:prepend>
                  <q-icon name="notifications_active" size="18px" color="grey-6" />
                </template>
              </q-select>
            </div>

            <div class="col-6">
              <q-select
                v-model="sortOrder"
                :options="sortOptions"
                emit-value
                map-options
                dense
                outlined
                rounded
                bg-color="white"
                class="filter-select"
                behavior="menu"
              >
                <template v-slot:prepend>
                  <q-icon name="sort" size="18px" color="grey-6" />
                </template>
              </q-select>
            </div>
          </div>

          <!-- Filter Chips: Read Status -->
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

          <!-- Notifications List -->
          <div class="notifications-wrapper">
            <div v-if="filteredNotifications.length === 0" class="text-center text-grey-6 q-pa-xl">
              ไม่พบการแจ้งเตือน
            </div>

            <div v-else class="notifications-list q-gutter-y-md q-pb-xl">
              <q-card
                v-for="item in filteredNotifications"
                :key="item.notification_id"
                flat
                bordered
                class="notification-card"
                :class="{ 'unread-card': item.is_read === '0' }"
                clickable
                @click="openDetail(item)"
              >
                <q-card-section class="q-pa-md">
                  <div class="row q-gutter-x-sm q-mb-md">
                    <q-badge
                      :color="item.type === 'alert' ? 'orange-1' : 'blue-1'"
                      :text-color="item.type === 'alert' ? 'orange-8' : 'blue-8'"
                      class="tag-badge tag-badge-large"
                    >
                      <q-icon :name="item.type === 'alert' ? 'warning' : 'info'" size="16px" class="q-mr-xs" />
                      {{ item.type === 'alert' ? 'ข้อมูลสำคัญ' : 'ข้อมูลทั่วไป' }}
                    </q-badge>
                  </div>

                  <div class="row justify-between items-start q-mb-sm">
                    <div class="text-weight-bold text-dark" style="font-size: 16px; max-width: 65%; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                      {{ item.message }}
                    </div>
                    <q-badge
                      :class="item.is_read === '0' ? 'bg-blue-1 text-primary' : 'bg-grey-2 text-grey-8'"
                      class="status-badge"
                    >
                      {{ item.is_read === '0' ? 'ยังไม่อ่าน' : 'อ่านแล้ว' }}
                    </q-badge>
                  </div>
                </q-card-section>

                <q-separator color="grey-2" inset />

                <q-card-actions class="row justify-between items-center q-px-md q-py-sm">
                  <div class="row items-center text-grey-6" style="font-size: 13px;">
                    <q-icon name="calendar_today" size="16px" class="q-mr-sm" />
                    {{ formatDate(item.created_at) }}
                  </div>
                  <div class="row q-gutter-x-sm">
                    <q-btn
                      flat round dense
                      :icon="item.is_read === '0' ? 'done' : 'undo'"
                      color="grey-8"
                      class="bg-grey-2 action-btn"
                      @click.stop="toggleRead(item)"
                    />
                    <q-btn
                      flat round dense icon="delete"
                      color="grey-8"
                      class="bg-grey-2 action-btn"
                      @click.stop="deleteNotification(item.notification_id)"
                    />
                  </div>
                </q-card-actions>
              </q-card>
            </div>
          </div>
        </div>
      </q-page>
    </q-page-container>
  </q-layout>

  <!-- Detail Dialog -->
  <q-dialog v-model="showDetailDialog" maximized>
    <q-card class="notification-detail-dialog">
      <q-bar class="bg-primary text-white">
        <q-space />
        <q-btn icon="close" flat round dense @click="showDetailDialog = false" />
      </q-bar>

      <q-scroll-area class="detail-scroll-area">
        <q-card-section class="q-pa-lg" v-if="selectedNotification">
          <div class="q-mb-lg">
            <div class="row items-center q-mb-md">
              <q-badge
                :color="selectedNotification.type === 'alert' ? 'orange-1' : 'blue-1'"
                :text-color="selectedNotification.type === 'alert' ? 'orange-8' : 'blue-8'"
                class="tag-badge"
              >
                <q-icon :name="selectedNotification.type === 'alert' ? 'warning' : 'info'" size="16px" class="q-mr-xs" />
                {{ selectedNotification.type === 'alert' ? 'ข้อมูลสำคัญ' : 'ข้อมูลทั่วไป' }}
              </q-badge>
              <q-space />
              <q-badge
                :class="selectedNotification.is_read === '0' ? 'bg-blue-1 text-primary' : 'bg-grey-2 text-grey-8'"
                class="status-badge"
              >
                {{ selectedNotification.is_read === '0' ? 'ยังไม่อ่าน' : 'อ่านแล้ว' }}
              </q-badge>
            </div>

            <div class="text-h5 text-weight-bold text-dark q-mb-md">
              {{ selectedNotification.message }}
            </div>

            <div class="row items-center text-grey-6 q-mb-lg" style="font-size: 14px;">
              <q-icon name="calendar_today" size="20px" class="q-mr-sm" />
              {{ formatDate(selectedNotification.created_at) }}
            </div>
          </div>

          <q-separator class="q-mb-lg" />

          <div class="row q-gutter-sm">
            <q-btn
              flat
              rounded
              class="col bg-blue-1 text-primary"
              :icon="selectedNotification.is_read === '0' ? 'done' : 'undo'"
              :label="selectedNotification.is_read === '0' ? 'ทำเครื่องหมายว่าอ่านแล้ว' : 'ทำเครื่องหมายว่ายังไม่อ่าน'"
              @click="toggleRead(selectedNotification)"
            />
            <q-btn
              flat
              rounded
              class="col bg-red-1 text-negative"
              icon="delete"
              label="ลบ"
              @click="deleteAndClose"
            />
          </div>
        </q-card-section>
      </q-scroll-area>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// ==========================================
// Interface สำหรับข้อมูล
// ==========================================
interface NotificationItem {
  notification_id: number;
  message: string;
  type: string;
  is_read: string;
  created_at: string;
}

// ==========================================
// State & Reactive Variables
// ==========================================
const notifications = ref<NotificationItem[]>([
  { notification_id: 1, message: 'หมู่บ้านชิดชอบ วิลเลจ: ตรวจงวดที่ 2 รออนุมัติ', type: 'alert', is_read: '0', created_at: new Date().toISOString() },
  { notification_id: 2, message: 'คุณได้รับมอบหมายงานใหม่ สำหรับการตรวจสถานที่ที่โครงการใหม่ในพื้นที่บางนา กรุงเทพมหานคร กรุณาตรวจสอบรายละเอียดและเตรียมตัวสำหรับการตรวจสอบ', type: 'info', is_read: '0', created_at: new Date(Date.now() - 3600000).toISOString() },
  { notification_id: 3, message: 'รายงานเดือนพฤษภาคม พร้อมแล้ว สามารถดาวน์โหลดได้จากระบบ', type: 'info', is_read: '1', created_at: '2026-06-05T10:00:00' },
  { notification_id: 4, message: 'ระบบตรวจบ้านมีปัญหาด้านการเชื่อมต่อฐานข้อมูล กรุณาติดต่อแอดมิน หรือรอการแก้ไขในเร็วๆ นี้', type: 'alert', is_read: '1', created_at: '2026-06-04T14:30:00' },
  { notification_id: 5, message: 'ทีมตรวจสอบ A ได้เสร็จสิ้นการตรวจงานที่โครงการเชิดชัง วิลเลจ กรุณาตรวจสอบผลการตรวจและอนุมัติเพื่อให้เสร็จสิ้น', type: 'info', is_read: '0', created_at: '2026-06-06T09:15:00' },
  { notification_id: 6, message: 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ กรุณาลองใหม่อีกครั้ง', type: 'alert', is_read: '0', created_at: '2026-06-06T08:45:00' },
  { notification_id: 7, message: 'งานตรวจสอบที่โครงการแสงสำลี วิลเลจ ได้รับการมอบหมายให้ทีมตรวจสอบ B ตั้งแต่วันที่ 2026-06-10 เป็นต้นไป', type: 'info', is_read: '1', created_at: '2026-06-03T16:20:00' },
  { notification_id: 8, message: 'สัญญาของทีมตรวจสอบ C จะหมดอายุ ในวันที่ 2026-06-15 กรุณาทำการต่ออายุสัญญาเพื่อให้ทีมสามารถดำเนินการตรวจสอบต่อได้', type: 'alert', is_read: '1', created_at: '2026-06-02T11:30:00' },
  { notification_id: 9, message: 'ข้อมูลลูกค้าใหม่ บริษัท XYZ Construction ได้เพิ่มในระบบแล้ว', type: 'info', is_read: '1', created_at: '2026-06-01T13:45:00' },
  { notification_id: 10, message: 'การตรวจสอบคุณภาพ ณ โครงการหมู่บ้านชิดชอบ วิลเลจ เสร็จสิ้นแล้ว คะแนน: 8.5/10 พบข้อบกพร่องบางประการที่ต้องแก้ไข', type: 'info', is_read: '0', created_at: '2026-05-31T10:00:00' },
  { notification_id: 11, message: 'แจ้งเตือน: จำนวนผู้ตรวจสอบที่ใช้งานปกติ ลดลงเหลือเพียง 3 คน อาจส่งผลต่อการสำเร็จของโครงการ', type: 'alert', is_read: '1', created_at: '2026-05-30T15:25:00' },
  { notification_id: 12, message: 'ระบบได้ทำการสำรองข้อมูล (Backup) เสร็จสิ้นแล้ว ทั้งหมด 2.5 GB', type: 'info', is_read: '1', created_at: '2026-05-29T22:00:00' },
]);

const searchTerm = ref('');
const activeFilter = ref('all'); // all, unread, read
const selectedType = ref('ทั้งหมด'); // ทั้งหมด, ข้อมูลสำคัญ, ข้อมูลทั่วไป
const sortOrder = ref('desc'); // desc = ล่าสุด, asc = เก่า
const showDetailDialog = ref(false);
const selectedNotification = ref<NotificationItem | null>(null);

// ==========================================
// Dropdown Options
// ==========================================
const typeOptions = ['ทั้งหมด', 'ข้อมูลสำคัญ', 'ข้อมูลทั่วไป'];
const sortOptions = [
  { label: 'ล่าสุด - เก่า', value: 'desc' },
  { label: 'เก่า - ล่าสุด', value: 'asc' }
];

// ==========================================
// Format Date Helper
// ==========================================
const formatDate = (val: string) => {
  if (!val) return 'ไม่ระบุวันที่';
  try {
    const date = new Date(val);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hour}:${minute}`;
  } catch {
    return val;
  }
};

// ==========================================
// Filter Chips Logic
// ==========================================
const filters = computed(() => {
  const counts = {
    all: notifications.value.length,
    unread: notifications.value.filter((n) => n.is_read === '0').length,
    read: notifications.value.filter((n) => n.is_read === '1').length,
  };

  return [
    { label: 'ทั้งหมด', value: 'all', count: counts.all },
    { label: 'ยังไม่อ่าน', value: 'unread', count: counts.unread > 0 ? counts.unread : undefined },
    { label: 'อ่านแล้ว', value: 'read', count: counts.read > 0 ? counts.read : undefined },
  ];
});

// ==========================================
// Computed: Filtered & Sorted Notifications
// ==========================================
const filteredNotifications = computed(() => {
  let result = [...notifications.value];

  // 1. Filter by read status
  if (activeFilter.value === 'unread') {
    result = result.filter((n) => n.is_read === '0');
  } else if (activeFilter.value === 'read') {
    result = result.filter((n) => n.is_read === '1');
  }

  // 2. Filter by type
  if (selectedType.value !== 'ทั้งหมด') {
    const typeValue = selectedType.value === 'ข้อมูลสำคัญ' ? 'alert' : 'info';
    result = result.filter((n) => n.type === typeValue);
  }

  // 3. Filter by search term
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase();
    result = result.filter((n) => n.message.toLowerCase().includes(term));
  }

  // 4. Sort by date
  result.sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return sortOrder.value === 'desc' ? dateB - dateA : dateA - dateB;
  });

  return result;
});

// ==========================================
// Actions
// ==========================================
const openDetail = (item: NotificationItem) => {
  selectedNotification.value = item;
  showDetailDialog.value = true;
  // Mark as read when opened
  if (item.is_read === '0') {
    item.is_read = '1';
  }
};

const deleteAndClose = () => {
  if (selectedNotification.value) {
    deleteNotification(selectedNotification.value.notification_id);
    showDetailDialog.value = false;
  }
};

const toggleRead = (item: NotificationItem) => {
  item.is_read = item.is_read === '0' ? '1' : '0';
};

const deleteNotification = (id: number) => {
  notifications.value = notifications.value.filter((n) => n.notification_id !== id);
};

const markAllAsRead = () => {
  notifications.value.forEach((n) => (n.is_read = '1'));
};
</script>

<style scoped>
.admin-notifications-page {
  max-width: 600px;
  margin: 0 auto;
  min-height: 100vh;
}

.admin-notifications-page > div {
  margin-top: -50px;
}

/* Search Input */
.search-input {
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  padding: 2px 16px;
  height: 48px;
}

/* Dropdown Filter */
.filter-select :deep(.q-field__control) {
  height: 42px;
  min-height: 42px;
  border: 1px solid #e0e0e0;
}

.filter-select :deep(.q-field__control:before),
.filter-select :deep(.q-field__control:after) {
  border: none !important;
}

/* Filter Container */
.filter-container {
  overflow: hidden;
  margin-left: -16px;
  margin-right: -16px;
  width: calc(100% + 32px);
}

.filter-scroll-wrapper {
  padding: 4px 16px;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.filter-scroll-wrapper::-webkit-scrollbar {
  display: none;
}

/* Filter Chips */
.filter-chip {
  white-space: nowrap;
  padding: 8px 12px;
  border-radius: 20px !important;
  transition: all 0.2s ease;
}

.filter-chip:hover {
  background: #f5f5f5 !important;
}

.count-badge {
  border-radius: 10px;
  font-size: 11px;
  padding: 2px 6px;
}

/* Notifications Wrapper */
.notifications-wrapper {
  margin-left: -16px;
  margin-right: -16px;
  width: calc(100% + 32px);
}

.notifications-list {
  padding: 0 16px;
}

/* Notification Card */
.notification-card {
  border-radius: 12px !important;
  border-color: #f0f0f0 !important;
  transition: all 0.2s ease;
}

.notification-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.notification-card.unread-card {
  background-color: #f3f6ff;
  border-color: #e3f2fd !important;
}

/* Status & Tag Badges */
.status-badge {
  border-radius: 8px !important;
  font-size: 12px;
  padding: 4px 8px;
}

.tag-badge {
  border-radius: 6px !important;
  font-size: 13px;
  padding: 4px 8px;
}

.tag-badge-large {
  font-size: 14px !important;
  padding: 6px 10px !important;
}

/* Action Buttons */
.action-btn {
  border-radius: 8px !important;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background-color: #e0e0e0 !important;
}

/* Helper Classes */
.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.no-wrap {
  flex-wrap: nowrap;
}

.hide-scrollbar {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.hide-scrollbar::-webkit-scrollbar {
  display: none;
}

@media (max-width: 599px) {
  .admin-notifications-page {
    max-width: 100%;
  }
}

/* Detail Dialog */
.notification-detail-dialog {
  background-color: #f3f6ff;
}

.detail-scroll-area {
  height: 100%;
}

.notification-detail-dialog :deep(.q-scrollarea__thumb) {
  background-color: #bdbdbd;
  width: 4px;
}
</style>
