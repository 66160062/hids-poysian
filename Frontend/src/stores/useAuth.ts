// src/stores/useAuth.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from 'src/boot/axios';
import { LocalStorage } from 'quasar';
import type { User } from 'src/models';

export const useAuthStore = defineStore('auth', () => {
  // --- STATE ---
  const user = ref<User | null>(null);
  const token = ref<string | null>(null);

  // --- GETTERS ---
  const isLogin = computed(() => !!token.value);
  const currentUser = computed(() => user.value);

  // --- ACTIONS ---
  async function login(email: string, password: string): Promise<boolean> {
    try {

      const res = await api.post('/auth/login', { email, password });

      user.value = res.data.user;
      token.value = res.data.access_token;

      // บันทึกลง LocalStorage
      LocalStorage.set('user', user.value);
      LocalStorage.set('token', token.value);

      return true;
    } catch (err) {
      console.error('Login Error:', err);
      return false;
    }
  }

  function logout() {
    user.value = null;
    token.value = null;
    LocalStorage.remove('user');
    LocalStorage.remove('token');
  }

  function loadUserFromStorage() {
    user.value = LocalStorage.getItem('user') as User | null;
    token.value = LocalStorage.getItem('token') as string | null;
  }

  loadUserFromStorage();

  return { user, token, isLogin, currentUser, login, logout };
});
