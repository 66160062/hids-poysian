<template>
  <q-page class="login-page flex flex-center">
    <div class="login-wrapper">
      <!-- Logo -->
      <div class="logo q-mb-lg">
        <img :src="Logos" class="logo-img" />
      </div>

      <!-- Card -->
      <q-card class="login-card">
        <q-card-section class="text-center">
          <div class="title">เข้าสู่ระบบ</div>
        </q-card-section>

        <q-card-section>
          <q-input v-model="email" placeholder="อีเมล" outlined dense class="q-mb-md" />

          <q-input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="รหัสผ่าน"
            outlined
            dense
          />

          <div class="text-right q-mt-xs">
            <a class="forgot">ลืมรหัสผ่าน?</a>
          </div>
        </q-card-section>

        <q-card-section class="flex flex-center">
          <q-btn label="เข้าสู่ระบบ" class="login-btn" :loading="loading" @click="login" />
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Logos from 'src/assets/Logos/Poysianlogo.png';

const email = ref<string>('');
const password = ref<string>('');

const loading = ref<boolean>(false);
const showPassword = ref<boolean>(false);

const login = async (): Promise<void> => {
  if (!email.value || !password.value) return;

  try {
    loading.value = true;

    await new Promise((resolve) => setTimeout(resolve, 1200));
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-page {
  background: #ffffff;
  min-height: 100vh;
}

/* wrapper */

.login-wrapper {
  width: 100%;
  max-width: 420px;
  padding: 20px;
}

/* logo */

.logo {
  display: flex;
  justify-content: center;
}

.logo-img {
  width: 320px;
  max-width: 90%;
  height: auto;
}

/* card */

.login-card {
  width: 100%;
  border-radius: 12px;
  border: 1px solid #cfcfcf;
  padding: 10px 20px 20px;
  background: white;
}

/* title */

.title {
  font-size: 28px;
  font-weight: 700;
  color: #2d6fb7;
}

/* inputs */

.input .q-field__control {
  border-radius: 8px;
  background: #f4f4f4;
}

/* forgot */

.forgot {
  font-size: 13px;
  color: #2d6fb7;
  cursor: pointer;
}

/* button */

.login-btn {
  width: 200px;
  max-width: 100%;
  border-radius: 10px;
  background: #2d6fb7;
  color: white;
  font-weight: 600;
}

/* ---------- Responsive ---------- */

@media (max-width: 600px) {
  .logo-img {
    width: 220px;
  }

  .title {
    font-size: 24px;
  }

  .login-card {
    padding: 20px;
  }
}
</style>
