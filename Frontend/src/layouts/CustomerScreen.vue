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
      <div class="row items-center cursor-pointer" @click="router.push('/customer')">
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

    <q-footer v-if="!isDetailPage" class="bg-white">
      <div ref="tabsRow" class="row no-wrap justify-around q-py-sm relative-position">
        <div
          v-for="item in menuList"
          :key="item.name"
          :ref="(el) => setTabRef(item.name, el)"
          class="column items-center cursor-pointer"
          :class="isActive(item.link) ? 'text-blue' : 'text-grey-5'"
          @click="handleTabClick(item)"
        >
          <q-icon :name="item.icon" size="24px" />
          <div class="text-caption text-weight-bold">{{ item.label }}</div>
        </div>

        <div class="bg-blue footer-tab-indicator" :style="indicatorStyle"></div>
      </div>
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
//import { useAuthStore } from 'src/stores/authStore'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import LanguageToggle from 'src/components/LanguageToggle.vue'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
//const authStore = useAuthStore()
const currentTitle = computed(() => {
  const key = route.meta.title as string | undefined
  return key ? t(key) : t('nav.customer.fallback')
})

const isDetailPage = computed(() => route.path.includes('/customer/defect-detail/'))

const goBack = () => {
  router.back()
}

const menuList = computed(() => [
  {
    name: 'dashboard',
    label: t('nav.customer.menuDashboard'),
    icon: 'home',
    link: '/customer',
  },
  {
    name: 'defect',
    label: t('nav.customer.menuDefect'),
    icon: 'assignment',
    link: '/customer/defect',
  },
  {
    name: 'report',
    label: t('nav.customer.menuReport'),
    icon: 'bar_chart',
    link: '/customer/report',
  },
])

function isActive(link: string) {
  if (link === '/customer') return route.path === '/customer'
  return route.path.startsWith(link)
}

const tabRefs = ref<Record<string, HTMLElement | null>>({})
function setTabRef(name: string, el: unknown) {
  tabRefs.value[name] = (el as HTMLElement) ?? null
}

const tabsRow = ref<HTMLElement | null>(null)
let tabsRowObserver: ResizeObserver | null = null

const indicatorStyle = ref({ left: '0px', width: '0px' })
function moveIndicatorTo(el: HTMLElement) {
  indicatorStyle.value = { left: `${el.offsetLeft}px`, width: `${el.offsetWidth}px` }
}

function updateIndicator() {
  const activeItem = menuList.value.find((item) => isActive(item.link))
  const el = activeItem ? tabRefs.value[activeItem.name] : null
  if (!el) return
  moveIndicatorTo(el)
}

async function handleTabClick(item: { name: string; link: string }) {
  const el = tabRefs.value[item.name]
  if (el) moveIndicatorTo(el)
  await router.push(item.link)
}

onMounted(() => {
  void nextTick(() => {
    updateIndicator()
    if (tabsRow.value) {
      tabsRowObserver = new ResizeObserver(() => updateIndicator())
      tabsRowObserver.observe(tabsRow.value)
    }
  })
  window.addEventListener('resize', updateIndicator)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateIndicator)
  tabsRowObserver?.disconnect()
  tabsRowObserver = null
})

watch(() => route.path, () => {
  void nextTick(updateIndicator)
})

// เปลี่ยนภาษาแล้วความกว้างของ label เปลี่ยน ต้องคำนวณตำแหน่งขีดใต้ใหม่
watch(locale, () => {
  void nextTick(updateIndicator)
})

</script>

<style scoped>
.footer-tab-indicator {
  position: absolute;
  bottom: 6px;
  height: 2px;
  border-radius: 1px;
  transition: left 0.25s ease, width 0.25s ease;
}

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