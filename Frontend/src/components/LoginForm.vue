<template>
  <q-card class="login-card">
    <q-card-section class="text-center">
      <div class="title">{{ t('login.title') }}</div>
    </q-card-section>

    <q-card-section>
      <q-input
        v-model="email"
        :placeholder="t('login.email')"
        outlined
        dense
        class="q-mb-md"
        @keyup.enter="handleLogin"
      />

      <q-input
        v-model="password"
        :type="showPassword ? 'text' : 'password'"
        :placeholder="t('login.password')"
        outlined
        dense
        @keyup.enter="handleLogin"
      >
        <template v-slot:append>
          <q-icon
            :name="showPassword ? 'visibility_off' : 'visibility'"
            class="cursor-pointer"
            @click="showPassword = !showPassword"
          />
        </template>
      </q-input>

      <div class="text-right q-mt-xs">
        <a class="forgot">{{ t('login.forgotPassword') }}</a>
      </div>

      <div v-if="loginFailed" class="error q-mt-sm">
        {{ t('login.invalidCredentials') }}
      </div>
    </q-card-section>

    <q-card-section class="flex flex-center">
      <q-btn
        :label="t('login.submit')"
        class="login-btn"
        :class="{ 'login-btn--loading': loading }"
        :loading="loading"
        :disable="!email || !password"
        @click="handleLogin"
      >
        <template v-slot:loading>
          <span class="login-spinner" />
        </template>
      </q-btn>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from 'src/stores/useAuth';

const router = useRouter();
const auth = useAuthStore();
const { t } = useI18n();

const email = ref('');
const password = ref('');
const loading = ref(false);
const showPassword = ref(false);
const loginFailed = ref(false);

const handleLogin = async () => {
  if (!email.value || !password.value || loading.value) return;

  loading.value = true;
  loginFailed.value = false;

  const success = await auth.login(email.value, password.value);

  if (success) {
    const role = auth.user?.role;

    if (role === 'inspector') {
      await router.push('/inspector/Inspectsdashboard');
    } else if (role === 'admin') {
      await router.push('/admin');
    } else if (role === 'customer') {
      await router.push('/customer');
    } else {
      await router.push('/dashboard');
    }
  } else {
    loginFailed.value = true;
  }

  loading.value = false;
};
</script>

<style scoped>
.login-card {
  width: 100%;
  border-radius: 12px;
  border: 1px solid #cfcfcf;
  padding: 10px 20px 20px;
}
.title {
  font-size: 28px;
  font-weight: 700;
  color: #2d6fb7;
}
.forgot {
  font-size: 13px;
  color: #2d6fb7;
  cursor: pointer;
}
.login-btn {
  width: 200px;
  border-radius: 10px;
  background: #2d6fb7;
  color: white;
  font-weight: 600;
}
.login-btn--loading {
  pointer-events: none;
}
.login-spinner {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2.5px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  animation: login-spin 0.6s linear infinite;
  display: inline-block;
}
@keyframes login-spin {
  to {
    transform: rotate(360deg);
  }
}
.error {
  color: red;
  font-size: 13px;
  text-align: center;
}
@media (max-width: 600px) {
  .title {
    font-size: 24px;
  }
  .login-card {
    padding: 20px;
  }
}
</style>
