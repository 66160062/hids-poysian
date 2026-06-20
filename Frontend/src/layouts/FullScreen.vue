<template>
  <q-layout>
    <q-page-container>
      <router-view v-slot="{ Component }">
        <transition name="jump" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </q-page-container>
  </q-layout>
</template>

<style scoped>
/* Page Transition Animations */
.jump-enter-active {
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.jump-leave-active {
  transition: all 0.15s ease-in;
}
.jump-enter-from {
  transform: translateY(20px);
  opacity: 0;
}
.jump-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}
</style>
