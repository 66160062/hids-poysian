<template>
  <q-layout view="lHh Lpr lFf" class="bg-grey-1">
    <q-header class="bg-white text-dark">
      <q-toolbar class="q-px-sm">
        <q-btn
          flat
          round
          dense
          icon="chevron_left"
          color="primary"
          :aria-label="t('adminManage.notifications.back')"
          @click="router.back"
        />
        <q-space />
        <q-toolbar-title class="text-center text-weight-bold text-body1 absolute-center">
          {{ t('adminManage.notifications.title') }}
        </q-toolbar-title>
        <q-space />
        <q-btn
          flat
          color="primary"
          :label="t('adminManage.notifications.markAllRead')"
          class="text-weight-bold"
          @click="markAllAsRead"
        />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <q-page class="admin-notifications-page bg-grey-1">
        <div class="q-px-md q-pt-lg">

          <!-- Search + Filter -->
          <div class="row q-gutter-x-sm no-wrap items-center q-mb-md">
            <q-input
              v-model="searchTerm"
              dense
              borderless
              rounded
              :placeholder="t('adminManage.notifications.searchPlaceholder')"
              class="search-input col"
              hide-bottom-space
            >
              <template v-slot:prepend>
                <q-icon name="search" color="grey-7" />
              </template>
              <template v-slot:append v-if="searchTerm">
                <q-icon name="close" class="cursor-pointer" @click="searchTerm = ''" />
              </template>
            </q-input>

            <q-btn
              round
              unelevated
              :color="activeFilterCount > 0 ? 'primary' : 'white'"
              :text-color="activeFilterCount > 0 ? 'white' : 'primary'"
              icon="tune"
              class="filter-btn"
              :class="{ 'filter-btn-outlined': activeFilterCount === 0 }"
              style="height: 48px; width: 48px; min-height: 48px"
              @click="showFilter = true"
            >
              <q-badge
                v-if="activeFilterCount > 0"
                color="red"
                floating
                rounded
                style="top: 2px; right: 2px"
                >{{ activeFilterCount }}</q-badge
              >
            </q-btn>
          </div>

          <!-- Notifications List -->
          <div class="notifications-wrapper">
            <div v-if="filteredNotifications.length === 0" class="text-center text-grey-6 q-pa-xl">
              <q-icon name="notifications_none" size="40px" color="grey-4" class="q-mb-sm" />
              <div>{{ t('adminManage.notifications.noResults') }}</div>
            </div>

            <div v-else class="notifications-list q-gutter-y-sm q-pb-xl">
              <q-card
                v-for="item in filteredNotifications"
                :key="item.notificationId"
                flat
                bordered
                v-ripple
                class="notification-card card-stagger"
                :class="{ 'unread-card': !item.isRead }"
                clickable
                @click="openDetail(item)"
              >
                <q-card-section class="row no-wrap items-start q-pa-md">
                  <div class="notif-avatar">
                    <q-icon
                      :name="item.type === 'alert' ? 'warning' : 'info'"
                      :color="item.type === 'alert' ? 'orange-8' : 'blue-8'"
                      size="22px"
                    />
                  </div>

                  <div class="col q-ml-md min-width-0">
                    <div class="row no-wrap items-start">
                      <div class="col notif-message" :class="{ 'text-weight-bold': !item.isRead }">
                        {{ item.message }}
                      </div>
                      <q-icon
                        v-if="!item.isRead"
                        name="fiber_manual_record"
                        color="primary"
                        size="9px"
                        class="q-ml-sm q-mt-xs unread-dot"
                      />
                    </div>

                    <div class="row items-center justify-between q-mt-sm">
                      <div class="row items-center text-grey-6 notif-meta">
                        <q-icon name="schedule" size="14px" class="q-mr-xs" />
                        {{ formatDate(item.createdAt) }}
                      </div>

                      <q-btn
                        flat
                        round
                        dense
                        icon="more_vert"
                        color="grey-8"
                        class="menu-trigger-btn"
                        style="margin-right: -8px"
                        @click.stop
                      >
                        <q-menu
                          auto-close
                          anchor="bottom right"
                          self="top right"
                          class="action-menu"
                          transition-show="jump-down"
                          transition-hide="jump-up"
                        >
                          <q-list class="action-menu-list">
                            <q-item clickable v-ripple class="action-menu-item" @click="toggleRead(item)">
                              <q-item-section avatar class="action-menu-avatar">
                                <div class="icon-chip icon-chip--primary">
                                  <q-icon :name="!item.isRead ? 'done' : 'undo'" size="18px" />
                                </div>
                              </q-item-section>
                              <q-item-section class="text-weight-medium">
                                {{ !item.isRead ? t('adminManage.notifications.markAsRead') : t('adminManage.notifications.markAsUnread') }}
                              </q-item-section>
                            </q-item>
                            <q-item clickable v-ripple class="action-menu-item action-menu-item--danger" @click="deleteNotification(item.notificationId)">
                              <q-item-section avatar class="action-menu-avatar">
                                <div class="icon-chip icon-chip--danger">
                                  <q-icon name="delete" size="18px" />
                                </div>
                              </q-item-section>
                              <q-item-section class="text-weight-medium">
                                {{ t('adminManage.notifications.delete') }}
                              </q-item-section>
                            </q-item>
                          </q-list>
                        </q-menu>
                      </q-btn>
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </div>
      </q-page>
    </q-page-container>
  </q-layout>

  <!-- Filter Dialog -->
  <q-dialog
    v-model="showFilter"
    position="bottom"
    transition-show="sheet-in"
    transition-hide="sheet-out"
  >
    <q-card
      style="width: 100%; max-width: 600px; max-height: 85vh; border-radius: 28px 28px 0 0"
      class="q-pa-lg"
    >
      <div class="sheet-handle" />
      <div class="row items-center justify-between q-mb-lg">
        <div class="text-h6 text-weight-bold text-dark">{{ t('adminManage.notifications.filterTitle') }}</div>
        <div class="row items-center">
          <q-btn
            v-if="activeFilterCount > 0"
            flat
            dense
            no-caps
            color="negative"
            :label="t('adminManage.notifications.clearAll')"
            class="q-mr-sm"
            @click="resetFilter"
          />
          <q-btn flat round dense icon="close" color="grey-6" v-close-popup />
        </div>
      </div>

      <div class="filter-scroll">
        <div class="text-weight-medium text-grey-8 q-mb-sm" style="font-size: 14px">{{ t('adminManage.notifications.sortLabel') }}</div>
        <div class="row q-gutter-sm q-mb-lg">
          <q-btn
            v-for="opt in sortOptions"
            :key="opt.value"
            unelevated
            rounded
            no-caps
            :color="sortOrder === opt.value ? 'primary' : 'grey-2'"
            :text-color="sortOrder === opt.value ? 'white' : 'grey-8'"
            class="filter-toggle-btn"
            @click="sortOrder = opt.value"
          >
            <span class="text-weight-medium q-px-sm">{{ opt.label }}</span>
          </q-btn>
        </div>

        <div class="text-weight-medium text-grey-8 q-mb-sm" style="font-size: 14px">{{ t('adminManage.notifications.typeLabel') }}</div>
        <div class="row q-gutter-sm q-mb-lg">
          <q-btn
            v-for="opt in typeOptions"
            :key="opt.value"
            unelevated
            rounded
            no-caps
            :color="selectedType === opt.value ? 'primary' : 'grey-2'"
            :text-color="selectedType === opt.value ? 'white' : 'grey-8'"
            class="filter-toggle-btn"
            @click="selectedType = opt.value"
          >
            <span class="text-weight-medium q-px-sm">{{ opt.label }}</span>
          </q-btn>
        </div>

        <div class="text-weight-medium text-grey-8 q-mb-sm" style="font-size: 14px">{{ t('adminManage.notifications.statusFilterLabel') }}</div>
        <div class="row q-gutter-sm q-mb-lg">
          <q-btn
            v-for="f in filters"
            :key="f.value"
            unelevated
            rounded
            no-caps
            :color="activeFilter === f.value ? 'primary' : 'grey-2'"
            :text-color="activeFilter === f.value ? 'white' : 'grey-8'"
            class="filter-toggle-btn"
            @click="activeFilter = f.value"
          >
            <span class="text-weight-medium q-px-sm">{{ f.label }}</span>
            <q-badge
              v-if="f.count !== undefined"
              :class="activeFilter === f.value ? 'bg-white text-primary' : 'bg-grey-3 text-grey-8'"
              class="q-ml-sm count-badge"
            >
              {{ f.count }}
            </q-badge>
          </q-btn>
        </div>
      </div>

      <q-btn
        unelevated
        rounded
        color="primary"
        :label="t('adminManage.notifications.search')"
        class="full-width text-weight-bold"
        style="height: 48px; font-size: 16px"
        v-close-popup
      />
    </q-card>
  </q-dialog>

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
                {{ selectedNotification.type === 'alert' ? t('adminManage.notifications.typeAlert') : t('adminManage.notifications.typeInfo') }}
              </q-badge>
              <q-space />
              <q-badge
                :class="!selectedNotification.isRead ? 'bg-blue-1 text-primary' : 'bg-grey-2 text-grey-8'"
                class="status-badge"
              >
                {{ !selectedNotification.isRead ? t('adminManage.notifications.statusUnread') : t('adminManage.notifications.statusRead') }}
              </q-badge>
            </div>

            <div class="text-h5 text-weight-bold text-dark q-mb-md">
              {{ selectedNotification.message }}
            </div>

            <div class="row items-center text-grey-6 q-mb-lg" style="font-size: 14px;">
              <q-icon name="calendar_today" size="20px" class="q-mr-sm" />
              {{ formatDate(selectedNotification.createdAt) }}
            </div>
          </div>

          <q-separator class="q-mb-lg" />

          <div class="row q-gutter-sm">
            <q-btn
              flat
              rounded
              class="col bg-blue-1 text-primary"
              :icon="!selectedNotification.isRead ? 'done' : 'undo'"
              :label="!selectedNotification.isRead ? t('adminManage.notifications.markAsRead') : t('adminManage.notifications.markAsUnread')"
              @click="toggleRead(selectedNotification)"
            />
            <q-btn
              flat
              rounded
              class="col bg-red-1 text-negative"
              icon="delete"
              :label="t('adminManage.notifications.delete')"
              @click="deleteAndClose"
            />
          </div>
        </q-card-section>
      </q-scroll-area>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { api } from 'src/boot/axios';

const router = useRouter();
const { t } = useI18n();

interface NotificationItem {
  notificationId: number;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  job: { jobId: number; inspectionType?: string | null } | null;
  round: { roundId: number } | null;
}

// เลือกหน้ารายละเอียดงานตามประเภทงาน (ตรวจก่อสร้าง vs ตรวจบ้าน) ให้ตรงกับ inspection-rounds.service.ts ฝั่ง backend
function resolveJobDetailPath(job: { jobId: number; inspectionType?: string | null }) {
  const isConstruction =
    job.inspectionType === 'CONSTRUCTION_INSPECTION' ||
    job.inspectionType === 'Construction' ||
    job.inspectionType === 'ตรวจก่อสร้าง';
  return isConstruction ? `/admin/work/cons/${job.jobId}` : `/admin/work/ins/${job.jobId}`;
}

const notifications = ref<NotificationItem[]>([]);
const loading = ref(false);

const fetchNotifications = async () => {
  loading.value = true;
  try {
    const { data } = await api.get<NotificationItem[]>('/notifications');
    notifications.value = data;
  } catch (error) {
    console.error(t('adminManage.notifications.fetchError'), error);
  } finally {
    loading.value = false;
  }
};

onMounted(fetchNotifications);

const searchTerm = ref('');
const activeFilter = ref('all');
const selectedType = ref('all');
const sortOrder = ref('desc');
const showFilter = ref(false);
const showDetailDialog = ref(false);
const selectedNotification = ref<NotificationItem | null>(null);

const typeOptions = computed(() => [
  { label: t('adminManage.notifications.typeAll'), value: 'all' },
  { label: t('adminManage.notifications.typeAlert'), value: 'alert' },
  { label: t('adminManage.notifications.typeInfo'), value: 'info' },
]);
const sortOptions = computed(() => [
  { label: t('adminManage.notifications.sortNewestFirst'), value: 'desc' },
  { label: t('adminManage.notifications.sortOldestFirst'), value: 'asc' },
]);

const activeFilterCount = computed(() => {
  let count = 0;
  if (selectedType.value !== 'all') count++;
  if (activeFilter.value !== 'all') count++;
  if (sortOrder.value !== 'desc') count++;
  return count;
});

const resetFilter = () => {
  selectedType.value = 'all';
  activeFilter.value = 'all';
  sortOrder.value = 'desc';
};

const formatDate = (val: string) => {
  if (!val) return t('adminManage.notifications.noDate');
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

const filters = computed(() => {
  const counts = {
    all: notifications.value.length,
    unread: notifications.value.filter((n) => !n.isRead).length,
    read: notifications.value.filter((n) => n.isRead).length,
  };

  return [
    { label: t('adminManage.notifications.filterAll'), value: 'all', count: counts.all },
    { label: t('adminManage.notifications.filterUnread'), value: 'unread', count: counts.unread > 0 ? counts.unread : undefined },
    { label: t('adminManage.notifications.filterRead'), value: 'read', count: counts.read > 0 ? counts.read : undefined },
  ];
});

const filteredNotifications = computed(() => {
  let result = [...notifications.value];

  if (activeFilter.value === 'unread') {
    result = result.filter((n) => !n.isRead);
  } else if (activeFilter.value === 'read') {
    result = result.filter((n) => n.isRead);
  }

  if (selectedType.value !== 'all') {
    result = result.filter((n) => n.type === selectedType.value);
  }

  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase();
    result = result.filter((n) => n.message.toLowerCase().includes(term));
  }

  result.sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return sortOrder.value === 'desc' ? dateB - dateA : dateA - dateB;
  });

  return result;
});

const openDetail = (item: NotificationItem) => {
  if (!item.isRead) {
    void toggleRead(item);
  }

  // แจ้งเตือนที่ผูกกับงาน/รอบตรวจ ให้พาไปหน้างานนั้น round นั้นตรงๆ แทนการเปิด dialog รายละเอียด
  if (item.job && item.round) {
    void router.push({
      path: resolveJobDetailPath(item.job),
      query: { roundId: String(item.round.roundId) },
    });
    return;
  }

  selectedNotification.value = item;
  showDetailDialog.value = true;
};

const deleteAndClose = () => {
  if (selectedNotification.value) {
    void deleteNotification(selectedNotification.value.notificationId);
    showDetailDialog.value = false;
  }
};

const toggleRead = async (item: NotificationItem) => {
  const nextIsRead = !item.isRead;
  item.isRead = nextIsRead;
  try {
    await api.patch(`/notifications/${item.notificationId}/read`, { isRead: nextIsRead });
  } catch (error) {
    item.isRead = !nextIsRead;
    console.error(t('adminManage.notifications.toggleReadError'), error);
  }
};

const deleteNotification = async (id: number) => {
  const previous = notifications.value;
  notifications.value = notifications.value.filter((n) => n.notificationId !== id);
  try {
    await api.delete(`/notifications/${id}`);
  } catch (error) {
    notifications.value = previous;
    console.error(t('adminManage.notifications.deleteError'), error);
  }
};

const markAllAsRead = async () => {
  const previous = notifications.value.map((n) => n.isRead);
  notifications.value.forEach((n) => (n.isRead = true));
  try {
    await api.patch('/notifications/mark-all-read');
  } catch (error) {
    notifications.value.forEach((n, i) => (n.isRead = previous[i] ?? n.isRead));
    console.error(t('adminManage.notifications.markAllError'), error);
  }
};
</script>

<style scoped>
.admin-notifications-page {
  max-width: 600px;
  margin: 0 auto;
  min-height: 100vh;
}

.search-input {
  background-color: #ffffff;
  border: 1px solid #ebebeb;
  border-radius: 24px;
  padding: 2px 16px;
  height: 48px;
  transition: border-color 200ms ease;
}

.search-input:focus-within {
  border-color: rgba(25, 118, 210, 0.5);
}

.filter-btn-outlined {
  border: 1px solid #ebebeb;
}

.notifications-wrapper {
  margin-left: -16px;
  margin-right: -16px;
  width: calc(100% + 32px);
}

.notifications-list {
  padding: 0 16px;
}

.min-width-0 {
  min-width: 0;
}

.notification-card {
  border-radius: 16px !important;
  border-color: #f0f0f0 !important;
  background: #ffffff !important;
  transition: all 0.2s ease;
  cursor: pointer;
  animation: card-in 300ms cubic-bezier(0.23, 1, 0.32, 1) both;
}
.notification-card:nth-child(1) { animation-delay: 0ms; }
.notification-card:nth-child(2) { animation-delay: 40ms; }
.notification-card:nth-child(3) { animation-delay: 80ms; }
.notification-card:nth-child(4) { animation-delay: 120ms; }
.notification-card:nth-child(n + 5) { animation-delay: 150ms; }
@keyframes card-in {
  from { opacity: 0; transform: translateY(8px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@media (prefers-reduced-motion: reduce) {
  .notification-card { animation-duration: 0.01ms !important; }
}

.notification-card:hover {
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

.notification-card.unread-card {
  background-color: #f8faff !important;
  border-color: #e3f2fd !important;
  border-left: 3px solid var(--q-primary, #1976d2) !important;
}

.notif-avatar {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.notif-message {
  font-size: 14px;
  color: #212121;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notif-meta {
  font-size: 12px;
}

.unread-dot {
  flex-shrink: 0;
}

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

@media (max-width: 599px) {
  .admin-notifications-page {
    max-width: 100%;
  }
}

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

.sheet-handle {
  width: 36px;
  height: 4px;
  border-radius: 999px;
  background: #e0e0e0;
  margin: -8px auto 16px;
}
.filter-scroll {
  max-height: 50vh;
  overflow-y: auto;
}
.filter-toggle-btn {
  min-width: fit-content;
  border: 1px solid #e0e0e0;
}
.count-badge {
  border-radius: 10px;
  font-size: 11px;
  padding: 2px 6px;
}

.menu-trigger-btn {
  transition: background-color 0.15s ease;
}

.action-menu-list {
  min-width: 190px;
  padding: 6px;
}
.action-menu-item {
  border-radius: 10px;
  padding: 6px 8px;
  margin-bottom: 2px;
  transition: background-color 0.15s ease;
}
.action-menu-item:last-child {
  margin-bottom: 0;
}
.action-menu-item:hover {
  background-color: #f2f4f7;
}
.action-menu-item--danger:hover {
  background-color: #fdecea;
}
.action-menu-avatar {
  min-width: 0;
  padding-right: 10px;
}
.icon-chip {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.icon-chip--primary {
  color: #1976d2;
}
.icon-chip--danger {
  color: #e53935;
}
</style>

<style>
.action-menu {
  border-radius: 14px !important;
  box-shadow: 0 10px 28px rgba(17, 24, 39, 0.14) !important;
  overflow: hidden;
}

/* Frosted-glass backdrop + spring-eased bottom sheet for the filter dialog */
.q-dialog__backdrop {
  backdrop-filter: blur(6px) saturate(180%);
  -webkit-backdrop-filter: blur(6px) saturate(180%);
}

.q-transition--sheet-in-enter-active {
  transition: all 320ms cubic-bezier(0.32, 0.72, 0, 1);
}
.q-transition--sheet-in-enter-from {
  transform: translateY(100%);
  opacity: 0.6;
}
.q-transition--sheet-out-leave-active {
  transition: all 200ms cubic-bezier(0.32, 0.72, 0, 1);
}
.q-transition--sheet-out-leave-to {
  transform: translateY(100%);
  opacity: 0.6;
}

@media (prefers-reduced-motion: reduce) {
  .q-transition--sheet-in-enter-active,
  .q-transition--sheet-out-leave-active {
    transition-duration: 0.01ms !important;
  }
}
</style>
