<template>
  <q-card
    flat
    bordered
    tabindex="0"
    role="button"
    class="customer-card cursor-pointer"
    v-ripple
    @click="$emit('edit', customer)"
    @keyup.enter="$emit('edit', customer)"
  >
    <q-card-section class="q-pa-md">
      <!-- Top Row: Name, Locale Badge, and Menu Button -->
      <div class="row justify-between items-center q-mb-sm">
        <div class="row items-center col ellipsis q-mr-sm" style="min-width: 0">
          <q-avatar size="38px" color="teal-1" text-color="teal-9" class="q-mr-sm text-weight-bold">
            {{ avatarInitial }}
          </q-avatar>
          <div class="col ellipsis">
            <div class="text-weight-bold text-dark ellipsis" style="font-size: 16px">
              {{ customer.name }}
            </div>
            <div class="text-caption text-grey-6 ellipsis">
              #{{ customer.id }}
            </div>
          </div>
        </div>

        <div class="row items-center q-gutter-x-xs no-wrap">
          <q-badge
            class="locale-badge"
            :class="customer.preferredLocale === 'en-US' ? 'bg-indigo-1 text-indigo-9' : 'bg-teal-1 text-teal-9'"
          >
            <q-icon name="translate" size="12px" class="q-mr-xs" />
            {{ customer.preferredLocale === 'en-US' ? 'EN' : 'TH' }}
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
                <q-item clickable v-ripple class="action-menu-item" @click="$emit('edit', customer)">
                  <q-item-section avatar class="action-menu-avatar">
                    <div class="icon-chip icon-chip--primary">
                      <q-icon name="edit" size="18px" />
                    </div>
                  </q-item-section>
                  <q-item-section class="text-weight-medium">
                    {{ t('adminManage.customerManagement.edit') }}
                  </q-item-section>
                </q-item>
                <q-item
                  clickable
                  v-ripple
                  class="action-menu-item action-menu-item--danger"
                  @click="$emit('delete', customer)"
                >
                  <q-item-section avatar class="action-menu-avatar">
                    <div class="icon-chip icon-chip--danger">
                      <q-icon name="delete" size="18px" />
                    </div>
                  </q-item-section>
                  <q-item-section class="text-weight-medium text-negative">
                    {{ t('adminManage.customerManagement.delete') }}
                  </q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>
      </div>

      <!-- Phone Numbers List (Supports multiple phones) -->
      <div class="contact-section q-mt-xs">
        <div class="row items-start text-grey-8 q-mb-xs" style="font-size: 13px">
          <q-icon name="phone" size="16px" color="primary" class="q-mr-xs q-mt-xs" />
          <div class="row q-gutter-xs col items-center wrap">
            <q-badge
              v-for="(p, idx) in phoneNumbers"
              :key="idx"
              color="grey-2"
              text-color="dark"
              class="tag-badge"
            >
              <span v-if="phoneNumbers.length > 1" class="text-weight-bold text-primary q-mr-xs">P{{ idx + 1 }}:</span>
              {{ p }}
            </q-badge>
          </div>
        </div>

        <!-- Emails List (Supports multiple emails) -->
        <div v-if="emailAddresses.length > 0" class="row items-start text-grey-8 q-mb-xs" style="font-size: 13px">
          <q-icon name="email" size="16px" color="teal-8" class="q-mr-xs q-mt-xs" />
          <div class="row q-gutter-xs col items-center wrap">
            <q-badge
              v-for="(e, idx) in emailAddresses"
              :key="idx"
              color="blue-1"
              text-color="primary"
              class="tag-badge ellipsis"
              style="max-width: 210px"
            >
              <span v-if="emailAddresses.length > 1" class="text-weight-bold text-teal-9 q-mr-xs">E{{ idx + 1 }}:</span>
              <span class="ellipsis">{{ e }}</span>
            </q-badge>
          </div>
        </div>

        <!-- Line ID (Optional) -->
        <div v-if="customer.lineId" class="row items-center text-grey-7" style="font-size: 13px">
          <q-icon name="chat" size="16px" color="green-7" class="q-mr-xs" />
          <span class="text-caption text-grey-8">Line: <strong>{{ customer.lineId }}</strong></span>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Customer } from 'src/stores/useCustomer';

const { t } = useI18n();

const props = defineProps<{
  customer: Customer;
}>();

defineEmits<{
  (e: 'edit', customer: Customer): void;
  (e: 'delete', customer: Customer): void;
}>();

const avatarInitial = computed(() => {
  return props.customer.name ? props.customer.name.charAt(0).toUpperCase() : 'C';
});

// รวมเบอร์โทรทั้งหมดที่มีค่า (phone, phone2, phone3)
const phoneNumbers = computed(() => {
  const list: string[] = [];
  if (props.customer.phone?.trim()) list.push(props.customer.phone.trim());
  if (props.customer.phone2?.trim()) list.push(props.customer.phone2.trim());
  if (props.customer.phone3?.trim()) list.push(props.customer.phone3.trim());
  return list.length > 0 ? list : ['-'];
});

// รวมอีเมลทั้งหมดที่มีค่า (email, email2, email3)
const emailAddresses = computed(() => {
  const list: string[] = [];
  if (props.customer.email?.trim()) list.push(props.customer.email.trim());
  if (props.customer.email2?.trim()) list.push(props.customer.email2.trim());
  if (props.customer.email3?.trim()) list.push(props.customer.email3.trim());
  return list;
});
</script>

<style scoped>
.customer-card {
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
  .customer-card:hover {
    border-color: #e4e4e4;
    box-shadow:
      0 2px 4px rgba(0, 0, 0, 0.04),
      0 8px 20px rgba(0, 0, 0, 0.07);
  }
}
.customer-card:focus-visible {
  outline: 2px solid var(--q-primary, #1976d2);
  outline-offset: 2px;
}
.locale-badge {
  font-weight: 700;
  font-size: 11.5px;
  padding: 4px 8px;
  border-radius: 12px;
  white-space: nowrap;
}
.tag-badge {
  font-size: 12px;
  padding: 3px 7px;
  border-radius: 6px;
  font-variant-numeric: tabular-nums;
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
