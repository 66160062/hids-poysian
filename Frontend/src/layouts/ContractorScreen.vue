<template>
  <q-layout view="lHh Lpr lFf">

    <q-header class="bg-white text-dark">
      <q-toolbar class="relative-position">
        <template v-if="isDetailPage">
          <q-icon
            name="arrow_back_ios_new"
            color="primary"
            size="24px"
            class="cursor-pointer q-mr-xs job-back-icon"
            @click="goBack"
          />
          <q-toolbar-title class="text-weight-bold job-detail-title">{{ currentTitle }}</q-toolbar-title>
        </template>
        <template v-else>
          <div class="row items-center cursor-pointer" @click="router.push('/contractor')">
            <q-icon
              v-if="route.meta.icon"
              :name="route.meta.icon as string"
              color="primary"
              size="24px"
              class="q-mr-xs"
            />
            <q-toolbar-title class="text-weight-bold">{{ currentTitle }}</q-toolbar-title>
          </div>
          <q-space />
          <div class="row items-center">
            <LanguageToggle />
          </div>
        </template>
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
import { useI18n } from 'vue-i18n'
import LanguageToggle from 'src/components/LanguageToggle.vue'

const { t } = useI18n()
const route  = useRoute()
const router = useRouter()

const currentTitle = computed(() => {
  const key = route.meta.title as string | undefined
  return key ? t(key) : t('nav.contractor.fallback')
})

const isDetailPage = computed(() => route.path.includes('/contractor/defect-detail/'))

const goBack = () => {
  router.back()
}
</script>

<style scoped>
.job-back-icon {
  position: relative;
  z-index: 2;
}

.job-detail-title {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 1;
  pointer-events: none;
}
</style>