<template>
  <div class="q-pa-md">
    <h4>Dashboard</h4>

    <q-btn label="Test API" color="primary" class="q-mr-md" @click="testApi" />

    <q-btn label="Logout" color="red" @click="logout" />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuthStore } from 'src/stores/useAuth';
import { api } from 'src/boot/axios';

const router = useRouter();
const auth = useAuthStore();

// ⭐ logout
const logout = async () => {
  auth.logout();
  await router.push('/login');
};

// ⭐ test axios interceptor
const testApi = async () => {
  try {
    const res = await api.get('https://jsonplaceholder.typicode.com/users');
    console.log('API RESULT:', res.data);
  } catch (error) {
    console.error('API ERROR:', error);
  }
};
</script>
