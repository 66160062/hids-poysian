<template>
  <q-page class="flex flex-center relative-position">
    <div class="absolute-top-right q-ma-md">
      <LanguageToggle />
    </div>

    <div class="column items-center">
      <img :src="Logos" alt="Logo" class="q-mb-md" />

      <LoginForm />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import LoginForm from 'src/components/LoginForm.vue';
import LanguageToggle from 'src/components/LanguageToggle.vue';
import Logos from 'src/assets/Logos/PoysianLogo.png';
</script>
