<template>
  <q-card flat bordered class="user-card">
    <q-card-section class="row items-start q-pa-sm">
      <q-avatar size="56px" class="q-mr-md bg-grey-3">
        <img :src="user.image_url" v-if="user.image_url" />
        <q-icon name="person" color="grey-5" v-else />
      </q-avatar>

      <div class="col">
        <div class="row items-center justify-between">
          <div class="text-weight-bold text-subtitle1">{{ user.full_name }}</div>
          <!-- Action Menu -->
          <q-btn flat round dense icon="more_vert" color="grey-7">
            <q-menu auto-close anchor="bottom right" self="top right">
              <q-list style="min-width: 150px">
                <q-item clickable @click="$emit('edit', user)">
                  <q-item-section avatar class="q-pr-none" style="min-width: 36px">
                    <q-icon name="edit" color="primary" size="sm" />
                  </q-item-section>
                  <q-item-section>แก้ไขข้อมูล</q-item-section>
                </q-item>
                <q-item clickable @click="$emit('delete', user)">
                  <q-item-section avatar class="q-pr-none" style="min-width: 36px">
                    <q-icon name="delete" color="negative" size="sm" />
                  </q-item-section>
                  <q-item-section class="text-negative">ลบผู้ใช้</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>

        <!-- Badges -->
        <div class="q-mb-xs">
          <q-chip
            dense
            :color="user.role === 'admin' ? 'blue-2' : 'teal-2'"
            :text-color="user.role === 'admin' ? 'blue-9' : 'teal-9'"
            class="text-caption text-weight-bold q-ma-none"
          >
            {{ user.role.toUpperCase() }}
          </q-chip>
          <q-chip
            v-if="user.role !== 'admin' && user.team_id"
            dense
            color="grey-2"
            text-color="grey-8"
            class="text-caption q-ml-sm q-ma-none"
          >
            ทีม {{ getTeamName(user.team_id) }}
          </q-chip>
        </div>

        <!-- Contact Info -->
        <div class="text-caption text-grey-8 row items-center q-mt-sm">
          <q-icon name="phone" size="xs" color="grey-6" class="q-mr-xs" />
          {{ user.phone_number || '-' }}
        </div>
        <div class="text-caption text-grey-8 row items-center q-mt-xs">
          <q-icon name="email" size="xs" color="grey-6" class="q-mr-xs" />
          <span class="ellipsis" style="max-width: 200px">{{ user.email || '-' }}</span>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import type { User } from 'src/pages/AdminUserManagementPage.vue';

interface Option {
  label: string;
  value: string | number;
}

const props = defineProps({
  user: {
    type: Object as () => User,
    required: true,
  },
  teamOptions: {
    type: Array as () => Option[],
    default: () => [],
  },
});

defineEmits(['edit', 'delete']);

const getTeamName = (teamId: number | null) => {
  const team = props.teamOptions.find((t) => t.value === teamId);
  return team ? team.label : 'ไม่ระบุ';
};
</script>

<style scoped>
.user-card {
  border-radius: 16px;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}
</style>
