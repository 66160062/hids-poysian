<template>
  <q-card flat bordered class="team-card cursor-pointer" @click="$emit('view-members', team)">
    <q-card-section class="row items-start q-pa-sm">
      <q-avatar size="56px" class="q-mr-md bg-white shadow-1">
        <img v-if="team.logo_url" :src="getImageUrl(team.logo_url)" />
        <q-icon v-else name="groups" color="grey-5" size="32px" />
      </q-avatar>

      <div class="col">
        <div class="row items-center justify-between">
          <div class="text-weight-bold text-subtitle1">{{ team.team_name }}</div>
          
          <!-- Action Menu -->
          <q-btn flat round dense icon="more_vert" color="grey-7" @click.stop>
            <q-menu auto-close anchor="bottom right" self="top right">
              <q-list style="min-width: 150px">
                <q-item clickable @click="$emit('edit', team)">
                  <q-item-section avatar class="q-pr-none" style="min-width: 36px">
                    <q-icon name="edit" color="primary" size="sm" />
                  </q-item-section>
                  <q-item-section>แก้ไขข้อมูล</q-item-section>
                </q-item>
                <q-item clickable @click="$emit('delete', team)">
                  <q-item-section avatar class="q-pr-none" style="min-width: 36px">
                    <q-icon name="delete" color="negative" size="sm" />
                  </q-item-section>
                  <q-item-section class="text-negative">ลบทีม</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>

        <div class="text-caption text-grey-8 row items-center q-mt-sm">
          <q-icon name="phone" size="xs" color="black" class="q-mr-xs" />
          {{ team.contact_info || '-' }}
        </div>
        
        <div class="text-caption text-grey-6 row items-center q-mt-xs">
          <q-icon name="people" size="xs" color="grey-6" class="q-mr-xs" />
          {{ memberCount }} สมาชิก
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import type { Team } from 'src/models';

defineProps({
  team: {
    type: Object as () => Team,
    required: true,
  },
  memberCount: {
    type: Number,
    default: 0
  }
});

defineEmits(['edit', 'delete', 'view-members']);

const getImageUrl = (url?: string | null) => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('blob:')) return url;
  return `${import.meta.env.VITE_API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};
</script>

<style scoped>
.team-card {
  border-radius: 16px;
  transition: transform 0.2s, box-shadow 0.2s;
}
.team-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
</style>
