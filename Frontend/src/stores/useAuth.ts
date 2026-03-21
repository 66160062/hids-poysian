import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from 'src/boot/axios';
import { LocalStorage } from 'quasar';
import type { User } from 'src/models.ts';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(null);

  const isLogin = computed(() => !!token.value);
  const currentUser = computed(() => user.value);

  async function login(email: string, password: string): Promise<boolean> {
    try {
      console.log('Calling:', api.defaults.baseURL + '/auth/login');
      const res = await api.post('/auth/login', { email, password });

      user.value = res.data.user;
      token.value = res.data.access_token;

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
    user.value = LocalStorage.getItem('user');
    token.value = LocalStorage.getItem('token');
  }

  loadUserFromStorage();

  return { user, token, isLogin, currentUser, login, logout };
});
