<template>
  <q-card
    flat
    bordered
    tabindex="0"
    role="button"
    class="master-card cursor-pointer"
    v-ripple
    @click="$emit('open')"
    @keyup.enter="$emit('open')"
  >
    <q-card-section class="q-pa-md">
      <div class="row justify-between items-center q-mb-sm no-wrap">
        <div
          class="text-weight-bold text-dark ellipsis col"
          style="font-size: 17px"
        >
          {{ title }}
        </div>
        <div class="row items-center no-wrap q-gutter-x-sm q-ml-sm">
          <q-badge v-if="badge" class="status-badge" :class="badgeClass || 'tone-badge'">
            {{ badge }}
          </q-badge>
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
                <q-item clickable v-ripple class="action-menu-item" @click="$emit('edit')">
                  <q-item-section avatar class="action-menu-avatar">
                    <div class="icon-chip icon-chip--primary">
                      <q-icon name="edit" size="18px" />
                    </div>
                  </q-item-section>
                  <q-item-section class="text-weight-medium">{{ t('adminManage.masterData.editItem') }}</q-item-section>
                </q-item>
                <q-item clickable v-ripple class="action-menu-item action-menu-item--danger" @click="$emit('delete')">
                  <q-item-section avatar class="action-menu-avatar">
                    <div class="icon-chip icon-chip--danger">
                      <q-icon name="delete" size="18px" />
                    </div>
                  </q-item-section>
                  <q-item-section class="text-weight-medium text-negative">{{ t('adminManage.masterData.deleteItem') }}</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>
      </div>

      <div class="row items-center text-grey-7" style="font-size: 13px">
        <q-icon :name="subtitleIcon" size="16px" class="q-mr-sm" />
        <span class="ellipsis" style="max-width: 80%">{{ subtitle || '-' }}</span>
      </div>
    </q-card-section>

    <q-separator color="grey-2" inset />

    <q-card-actions class="row items-center justify-between q-px-md q-py-sm">
      <div class="row q-gutter-x-sm items-center">
        <q-badge class="tag-badge tone-badge">#{{ id }}</q-badge>
        <slot name="tags" />
      </div>
      <slot name="action" />
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

withDefaults(
  defineProps<{
    title: string;
    subtitle?: string | null | undefined;
    subtitleIcon?: string;
    id: number | string;
    badge?: string;
    badgeClass?: string;
  }>(),
  {
    subtitle: '',
    subtitleIcon: 'translate',
    badge: '',
    badgeClass: '',
  },
);

defineEmits<{
  (e: 'open'): void;
  (e: 'edit'): void;
  (e: 'delete'): void;
}>();
</script>

<style scoped>
.master-card {
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  border-radius: 18px;
  border-color: #f0f0f0;
  height: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.03),
    0 2px 6px rgba(0, 0, 0, 0.03);
  transition:
    transform 200ms var(--ease-out),
    box-shadow 200ms var(--ease-out),
    border-color 200ms var(--ease-out);
}
@media (hover: hover) and (pointer: fine) {
  .master-card:hover {
    border-color: #e4e4e4;
    box-shadow:
      0 2px 4px rgba(0, 0, 0, 0.04),
      0 8px 20px rgba(0, 0, 0, 0.07);
  }
}
.master-card:focus-visible {
  outline: 2px solid var(--q-primary, #1976d2);
  outline-offset: 2px;
}
.master-card :deep(.q-separator) {
  margin-top: auto;
}
.tone-badge {
  background: var(--tone-soft, #f0f0f0);
  color: var(--tone-dark, #424242);
}
.status-badge {
  font-weight: 700;
  font-size: 12.5px;
  padding: 6px 14px;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  letter-spacing: 0.2px;
  white-space: nowrap;
}
.tag-badge {
  font-size: 12px;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 6px;
  font-variant-numeric: tabular-nums;
}

@media (prefers-reduced-motion: reduce) {
  .master-card {
    transition-duration: 0.01ms !important;
  }
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
</style>
