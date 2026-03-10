<template>
  <q-layout view="lHh Lpr lFf">
  <q-header class="bg-white text-dark"> <!--พื้นขาว ตัวดำ -->
  <q-toolbar>
    <q-btn flat round icon="arrow_back" color="dark" @click="router.push('/')" />
    <q-toolbar-title class="text-center text-weight-bold">{{ currentTitle }}</q-toolbar-title> <!-- ✅ กลาง + bold -->
    <!--<q-btn flat round icon="logout" color="dark" @click="authStore.logout()" />-->
  </q-toolbar>
</q-header>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer>
  <q-tabs
    v-model="activeTab"
    dense
    align="justify"
    class="bg-white text-grey-7"
    active-color="primary"
    indicator-color="primary"
    style="min-height: 56px;"
  >
    <q-route-tab
      v-for="item in menuList"
      :key="item.name"
      :name="item.name"
      :icon="item.icon"
      :label="item.label"
      :to="item.link"
      style="min-height: 56px; padding: 4px 0;"
    />
  </q-tabs>
</q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
//import { useAuthStore } from 'src/stores/authStore'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
//const authStore = useAuthStore()
const currentTitle = computed(() => route.meta.title as string || 'Customer')
const menuList = [
  {
    name: 'dashboard',
    label: 'ภาพรวม',
    icon: 'home',
    link: '/customer',
  },
  {
    name: 'defect',
    label: 'รายการ Defect',
    icon: 'assignment',
    link: '/customer/defect',
  },
  {
    name: 'report',
    label: 'สรุปรายงาน',
    icon: 'bar_chart',
    link: '/app/report',
  },
]

const activeTab = ref('dashboard')
</script>