<template>
  <q-page class="flex flex-center">
    <div class="column items-center">
      <img :src="Logos" alt="Logo" class="q-mb-md" />

      <LoginForm />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import LoginForm from 'src/components/LoginForm.vue';
import Logos from 'src/assets/Logos/Poysianlogo.png';
</script>
