<template>
  <q-layout view="lHh Lpr lFf">

    <q-header class="bg-white text-dark" elevated style="box-shadow: 0 1px 4px rgba(0,0,0,0.08);">
      <q-toolbar>
        <q-btn
          flat round
          icon="arrow_back"
          color="dark"
          @click="goBack"
        />
        <q-toolbar-title class="text-center text-weight-bold" style="font-size:16px;">
          {{ currentTitle }}
        </q-toolbar-title>
        <!-- placeholder ให้ title อยู่กึ่งกลาง -->
        <q-btn flat round icon="arrow_back" color="transparent" disable />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>

  </q-layout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route  = useRoute()
const router = useRouter()

const currentTitle = computed(() => route.meta.title as string || 'Contractor')

const goBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    void router.push('/')
  }
}
</script>