<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer class="bg-white">
      <q-tabs v-model="activeTab" active-color="blue" indicator-color="blue" align="justify">
        <q-tab
          name="inspection"
          icon="home_repair_service"
          label="การตรวจบ้าน"
          @click="$router.push('/inspector')"
        />
        <q-tab
          name="progress"
          icon="assignment"
          label="การตรวจความคืบหน้า"
          @click="$router.push('/inspector/progress')"
        />
      </q-tabs>
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const activeTab = ref('inspection');
</script>
