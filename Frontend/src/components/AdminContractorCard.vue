<template>
  <q-card
    flat
    bordered
    tabindex="0"
    role="button"
    class="contractor-card cursor-pointer"
    v-ripple
    @click="$emit('edit', contractor)"
    @keyup.enter="$emit('edit', contractor)"
  >
    <q-card-section class="q-pa-md">
      <!-- Top Row: Name, Company Badge, and Menu Button -->
      <div class="row justify-between items-center q-mb-sm">
        <div class="row items-center col ellipsis q-mr-sm" style="min-width: 0">
          <q-avatar size="38px" color="amber-1" text-color="amber-10" class="q-mr-sm text-weight-bold">
            {{ avatarInitial }}
          </q-avatar>
          <div class="col ellipsis">
            <div class="text-weight-bold text-dark ellipsis" style="font-size: 16px">
              {{ contractor.fullName }}
            </div>
            <div class="text-caption text-grey-6 ellipsis">
              #{{ contractor.contractorId }}
            </div>
          </div>
        </div>

        <div class="row items-center q-gutter-x-xs no-wrap">
          <q-badge
            v-if="contractor.companyName"
            color="orange-1"
            text-color="orange-9"
            class="company-badge ellipsis"
            style="max-width: 140px"
          >
            <q-icon name="apartment" size="12px" class="q-mr-xs" />
            <span class="ellipsis">{{ contractor.companyName }}</span>
          </q-badge>

          <q-btn
            flat
            round
            dense
            icon="more_vert"
            color="grey-8"
            class="menu-trigger-btn"
            style="margin-right: -6px"
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
                <q-item clickable v-ripple class="action-menu-item" @click="$emit('edit', contractor)">
                  <q-item-section avatar class="action-menu-avatar">
                    <div class="icon-chip icon-chip--primary">
                      <q-icon name="edit" size="18px" />
                    </div>
                  </q-item-section>
                  <q-item-section class="text-weight-medium">
                    {{ t('adminManage.contractorManagement.edit') }}
                  </q-item-section>
                </q-item>
                <q-item
                  clickable
                  v-ripple
                  class="action-menu-item action-menu-item--danger"
                  @click="$emit('delete', contractor)"
                >
                  <q-item-section avatar class="action-menu-avatar">
                    <div class="icon-chip icon-chip--danger">
                      <q-icon name="delete" size="18px" />
                    </div>
                  </q-item-section>
                  <q-item-section class="text-weight-medium text-negative">
                    {{ t('adminManage.contractorManagement.delete') }}
                  </q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>
      </div>

      <!-- Contact Info -->
      <div class="contact-section q-mt-xs">
        <div class="row items-center text-grey-8 q-mb-xs" style="font-size: 13px">
          <q-icon name="phone" size="16px" color="primary" class="q-mr-xs" />
          <span class="text-weight-medium">{{ contractor.phoneNumber || '-' }}</span>
        </div>

        <div v-if="contractor.email" class="row items-center text-grey-8 q-mb-xs" style="font-size: 13px">
          <q-icon name="email" size="16px" color="teal-8" class="q-mr-xs" />
          <span class="ellipsis">{{ contractor.email }}</span>
        </div>

        <div v-if="contractor.companyName" class="row items-center text-grey-7" style="font-size: 13px">
          <q-icon name="business" size="16px" color="blue-7" class="q-mr-xs" />
          <span class="text-caption text-grey-8 ellipsis">{{ contractor.companyName }}</span>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Contractor } from 'src/stores/useContractor';

const { t } = useI18n();

const props = defineProps<{
  contractor: Contractor;
}>();

defineEmits<{
  (e: 'edit', contractor: Contractor): void;
  (e: 'delete', contractor: Contractor): void;
}>();

const avatarInitial = computed(() => {
  return props.contractor.fullName ? props.contractor.fullName.charAt(0).toUpperCase() : 'K';
});
</script>

<style scoped>
.contractor-card {
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
  .contractor-card:hover {
    border-color: #e4e4e4;
    box-shadow:
      0 2px 4px rgba(0, 0, 0, 0.04),
      0 8px 20px rgba(0, 0, 0, 0.07);
  }
}
.contractor-card:focus-visible {
  outline: 2px solid var(--q-primary, #1976d2);
  outline-offset: 2px;
}
.company-badge {
  font-weight: 600;
  font-size: 11.5px;
  padding: 4px 8px;
  border-radius: 12px;
  white-space: nowrap;
}
.action-menu {
  border-radius: 14px;
  overflow: hidden;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.08),
    0 10px 24px -2px rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(0, 0, 0, 0.06);
  min-width: 160px;
}
.action-menu-list {
  padding: 6px;
}
.action-menu-item {
  border-radius: 10px;
  min-height: 40px;
  padding: 8px 12px;
  font-size: 13.5px;
}
.action-menu-avatar {
  min-width: 28px;
  padding-right: 8px;
}
.icon-chip {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.icon-chip--primary {
  background: #eff6ff;
  color: #2563eb;
}
.icon-chip--danger {
  background: #fef2f2;
  color: #dc2626;
}
</style>
