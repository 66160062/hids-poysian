<template>
  <q-layout view="lHh Lpr lFf" class="bg-grey-1">
    <q-header class="bg-white text-dark">
      <q-toolbar class="q-px-sm">
        <q-icon
          name="arrow_back_ios_new"
          color="primary"
          size="24px"
          class="cursor-pointer"
          @click="router.back"
        />
        <q-space />
        <q-toolbar-title class="text-center text-weight-bold absolute-center notification-title">
          {{ t('inspector.notifications.title') }}
        </q-toolbar-title>
        <q-space />
        <q-btn
          flat
          color="primary"
          :label="t('inspector.notifications.markAllRead')"
          class="text-weight-bold"
          @click="markAllAsRead"
        />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <q-page class="inspector-notifications-page bg-grey-1">
        <div class="q-px-md q-pt-lg">

          <!-- Search Input -->
          <div class="row q-mb-sm">
            <q-input
              v-model="searchTerm"
              dense
              borderless
              rounded
              :placeholder="t('inspector.notifications.searchPlaceholder')"
              class="col search-input"
            >
              <template v-slot:prepend>
                <q-icon name="search" color="grey-6" />
              </template>
            </q-input>
          </div>

          <!-- Filter Chips: Read Status + Sort -->
          <div class="row items-center no-wrap q-gutter-x-sm q-mb-md">
            <div class="filter-scroll-wrapper no-wrap scroll-x hide-scrollbar row q-gutter-x-sm q-px-none col">
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

            <q-btn
              flat
              round
              dense
              color="grey-7"
              icon="filter_list"
              class="sort-toggle-btn"
            >
              <q-menu anchor="bottom right" self="top right">
                <q-list style="min-width: 160px">
                  <q-item clickable v-close-popup :active="sortOrder === 'desc'" active-class="text-primary" @click="sortOrder = 'desc'">
                    <q-item-section>{{ t('inspector.notifications.sortNewestFirst') }}</q-item-section>
                  </q-item>
                  <q-item clickable v-close-popup :active="sortOrder === 'asc'" active-class="text-primary" @click="sortOrder = 'asc'">
                    <q-item-section>{{ t('inspector.notifications.sortOldestFirst') }}</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </div>

          <!-- Notifications List -->
          <div class="notifications-wrapper">
            <div v-if="filteredNotifications.length === 0" class="text-center text-grey-6 q-pa-xl">
              {{ t('inspector.notifications.noResults') }}
            </div>

            <div v-else class="notifications-list q-gutter-y-md q-pb-xl">
              <q-card
                v-for="item in filteredNotifications"
                :key="item.notificationId"
                flat
                bordered
                class="notification-card"
                :class="{ 'unread-card': !item.isRead }"
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
                      {{ item.type === 'alert' ? t('inspector.notifications.typeAlert') : t('inspector.notifications.typeInfo') }}
                    </q-badge>
                  </div>

                  <div class="row justify-between items-start q-mb-sm">
                    <div class="text-weight-bold text-dark" style="font-size: 16px; max-width: 65%; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                      {{ item.message }}
                    </div>
                    <q-badge
                      :class="!item.isRead ? 'bg-blue-1 text-primary' : 'bg-grey-2 text-grey-8'"
                      class="status-badge"
                    >
                      {{ !item.isRead ? t('inspector.notifications.unread') : t('inspector.notifications.read') }}
                    </q-badge>
                  </div>
                </q-card-section>

                <q-separator color="grey-2" inset />

                <q-card-actions class="row justify-between items-center q-px-md q-py-sm">
                  <div class="row items-center text-grey-6" style="font-size: 13px;">
                    <q-icon name="calendar_today" size="16px" class="q-mr-sm" />
                    {{ formatDate(item.createdAt) }}
                  </div>
                  <div class="row q-gutter-x-sm">
                    <q-btn
                      flat round dense
                      :icon="!item.isRead ? 'done' : 'undo'"
                      color="grey-8"
                      class="bg-grey-2 action-btn"
                      @click.stop="toggleRead(item)"
                    />
                    <q-btn
                      flat round dense icon="delete"
                      color="grey-8"
                      class="bg-grey-2 action-btn"
                      @click.stop="deleteNotification(item.notificationId)"
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
                {{ selectedNotification.type === 'alert' ? t('inspector.notifications.typeAlert') : t('inspector.notifications.typeInfo') }}
              </q-badge>
              <q-space />
              <q-badge
                :class="!selectedNotification.isRead ? 'bg-blue-1 text-primary' : 'bg-grey-2 text-grey-8'"
                class="status-badge"
              >
                {{ !selectedNotification.isRead ? t('inspector.notifications.unread') : t('inspector.notifications.read') }}
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
              :label="!selectedNotification.isRead ? t('inspector.notifications.markRead') : t('inspector.notifications.markUnread')"
              @click="toggleRead(selectedNotification)"
            />
            <q-btn
              flat
              rounded
              class="col bg-red-1 text-negative"
              icon="delete"
              :label="t('inspector.notifications.delete')"
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
import { useQuasar } from 'quasar';
import { createIconSpinner } from 'src/composables/useIconSpinner';

const $q = useQuasar();
const inspectorNotifSpinner = createIconSpinner('notifications');

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

// พา inspector ไปหน้ารายละเอียดงาน ซึ่งฝั่ง inspector ใช้ roundId เป็น param (ไม่ใช่ jobId แบบฝั่ง admin)
// ถ้าแจ้งเตือนยังไม่ผูก round (เช่น เพิ่งถูกมอบหมายงานแต่ยังไม่มีรอบตรวจ) ให้พาไปหน้ารายการงานแทน
function resolveJobDetailPath(round: { roundId: number } | null) {
  return round ? `/inspector/job/${round.roundId}` : '/inspector/Inspectsdashboard';
}

const notifications = ref<NotificationItem[]>([]);
const loading = ref(false);

const fetchNotifications = async () => {
  loading.value = true;
  try {
    const { data } = await api.get<NotificationItem[]>('/notifications');
    notifications.value = data;
  } catch (error) {
    console.error('โหลดการแจ้งเตือนไม่สำเร็จ', error);
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  $q.loading.show({
    spinner: inspectorNotifSpinner,
    spinnerColor: 'primary',
    spinnerSize: 70,
    backgroundColor: 'white',
  });
  try {
    await fetchNotifications();
  } finally {
    $q.loading.hide();
  }
});

const searchTerm = ref('');
const activeFilter = ref('all');
const sortOrder = ref('desc');
const showDetailDialog = ref(false);
const selectedNotification = ref<NotificationItem | null>(null);

const formatDate = (val: string) => {
  if (!val) return t('inspector.notifications.dateNotSpecified');
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
    { label: t('inspector.notifications.filterAll'), value: 'all', count: counts.all },
    { label: t('inspector.notifications.filterUnread'), value: 'unread', count: counts.unread > 0 ? counts.unread : undefined },
    { label: t('inspector.notifications.filterRead'), value: 'read', count: counts.read > 0 ? counts.read : undefined },
  ];
});

const filteredNotifications = computed(() => {
  let result = [...notifications.value];

  if (activeFilter.value === 'unread') {
    result = result.filter((n) => !n.isRead);
  } else if (activeFilter.value === 'read') {
    result = result.filter((n) => n.isRead);
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

  if (item.job) {
    void router.push(resolveJobDetailPath(item.round));
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
    console.error('อัปเดตสถานะการอ่านไม่สำเร็จ', error);
  }
};

const deleteNotification = async (id: number) => {
  const previous = notifications.value;
  notifications.value = notifications.value.filter((n) => n.notificationId !== id);
  try {
    await api.delete(`/notifications/${id}`);
  } catch (error) {
    notifications.value = previous;
    console.error('ลบการแจ้งเตือนไม่สำเร็จ', error);
  }
};

const markAllAsRead = async () => {
  const previous = notifications.value.map((n) => n.isRead);
  notifications.value.forEach((n) => (n.isRead = true));
  try {
    await api.patch('/notifications/mark-all-read');
  } catch (error) {
    notifications.value.forEach((n, i) => (n.isRead = previous[i] ?? n.isRead));
    console.error('ทำเครื่องหมายอ่านทั้งหมดไม่สำเร็จ', error);
  }
};
</script>

<style scoped>
.inspector-notifications-page {
  max-width: 600px;
  margin: 0 auto;
  min-height: 100vh;
}

.notification-title {
  font-size: 21px;
  letter-spacing: 0.01em;
}

.search-input {
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  padding: 2px 16px;
  height: 48px;
}

.filter-scroll-wrapper {
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.filter-scroll-wrapper::-webkit-scrollbar {
  display: none;
}

/* Sort Toggle Button */
.sort-toggle-btn {
  width: 36px;
  height: 36px;
  min-height: 36px;
  flex-shrink: 0;
}

.filter-chip {
  white-space: nowrap;
  padding: 8px 12px;
  border-radius: 20px !important;
  transition: all 0.2s ease;
}

.count-badge {
  border-radius: 10px;
  font-size: 11px;
  padding: 2px 6px;
}

.notifications-wrapper {
  margin-left: -16px;
  margin-right: -16px;
  width: calc(100% + 32px);
}

.notifications-list {
  padding: 0 16px;
}

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

.action-btn {
  border-radius: 8px !important;
  transition: all 0.2s ease;
}

.hide-scrollbar {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.hide-scrollbar::-webkit-scrollbar {
  display: none;
}

@media (max-width: 599px) {
  .inspector-notifications-page {
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
</style>
