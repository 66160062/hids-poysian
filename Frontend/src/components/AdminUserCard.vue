<template>
  <q-card
    flat
    bordered
    tabindex="0"
    role="button"
    class="user-card cursor-pointer"
    v-ripple
    @click="$emit('edit', user)"
    @keyup.enter="$emit('edit', user)"
  >
    <q-card-section class="q-pa-md">
      <div class="row justify-between items-center q-mb-sm">
        <div
          class="text-weight-bold text-dark ellipsis"
          style="font-size: 17px; max-width: 50%"
        >
          {{ user.fullName }}
        </div>
        <div class="row items-center q-gutter-x-sm">
          <q-badge
            class="status-badge"
            :class="user.role === 'admin' ? 'bg-blue-1 text-blue-9' : 'bg-teal-1 text-teal-9'"
          >
            {{ roleLabel }}
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
                <q-item clickable v-ripple class="action-menu-item" @click="$emit('edit', user)">
                  <q-item-section avatar class="action-menu-avatar">
                    <div class="icon-chip icon-chip--primary">
                      <q-icon name="edit" size="18px" />
                    </div>
                  </q-item-section>
                  <q-item-section class="text-weight-medium">{{ t('components.adminUserCard.edit') }}</q-item-section>
                </q-item>
                <q-item clickable v-ripple class="action-menu-item action-menu-item--danger" @click="$emit('delete', user)">
                  <q-item-section avatar class="action-menu-avatar">
                    <div class="icon-chip icon-chip--danger">
                      <q-icon name="delete" size="18px" />
                    </div>
                  </q-item-section>
                  <q-item-section class="text-weight-medium text-negative"
                    >{{ t('components.adminUserCard.deleteUser') }}</q-item-section
                  >
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>
      </div>

      <div class="row items-center text-grey-7 justify-between" style="font-size: 13px">
        <div class="row items-center col ellipsis">
          <q-icon name="work" size="16px" class="q-mr-xs" />
          <span class="ellipsis" style="max-width: 140px">
            {{ user.team ? user.team.team_name : t('components.adminUserCard.noTeam') }}
          </span>
        </div>
        <q-badge
          v-if="branchName"
          color="indigo-1"
          text-color="indigo-9"
          class="tag-badge text-weight-bold"
        >
          <q-icon name="business" size="12px" class="q-mr-xs" />
          {{ branchName }}
        </q-badge>
      </div>
    </q-card-section>

    <q-separator color="grey-2" inset />

    <q-card-actions class="row items-center q-px-md q-py-sm">
      <div class="row q-gutter-x-sm">
        <q-badge color="grey-2" text-color="grey-8" class="tag-badge">
          <q-icon name="phone" size="14px" class="q-mr-xs" /> {{ user.phoneNumber || '-' }}
        </q-badge>
        <q-badge v-if="user.email" color="grey-2" text-color="grey-8" class="tag-badge">
          <q-icon name="email" size="14px" class="q-mr-xs" />
          <span class="ellipsis" style="max-width: 140px">{{ user.email }}</span>
        </q-badge>
      </div>
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useBranchStore } from 'src/stores/useBranch';
import type { User } from 'src/models';

const { t } = useI18n();
const branchStore = useBranchStore();

const props = defineProps({
  user: {
    type: Object as () => User,
    required: true,
  }
});

const branchName = computed(() => {
  if (props.user.branch?.branchName) {
    return props.user.branch.branchName;
  }
  if (props.user.team?.branch?.branchName) {
    return props.user.team.branch.branchName;
  }
  const bId = props.user.branchId ?? props.user.team?.branchId;
  if (!bId) return '';
  const found = branchStore.branches.find((b) => b.branchId === bId);
  return found?.branchName || '';
});

const ROLE_LABEL_KEYS: Record<string, string> = {
  admin: 'adminManage.userManagement.roleAdmin',
  inspector: 'adminManage.userManagement.roleInspector',
};

const roleLabel = computed(() => {
  const key = ROLE_LABEL_KEYS[props.user.role];
  return key ? t(key) : props.user.role.toUpperCase();
});

defineEmits(['edit', 'delete']);
</script>

<style scoped>
.user-card {
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  border-radius: 18px;
  border-color: #f0f0f0;
  height: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  transition: border-color 200ms var(--ease-out);
}
@media (hover: hover) and (pointer: fine) {
  .user-card:hover {
    border-color: #d0d0d0;
  }
}
.user-card:focus-visible {
  outline: 2px solid var(--q-primary, #1976d2);
  outline-offset: 2px;
}
.user-card :deep(.q-separator) {
  margin-top: auto;
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
  .user-card {
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
