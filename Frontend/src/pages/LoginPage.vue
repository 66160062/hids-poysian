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

          <div v-if="errorMessage" class="error q-mt-sm">
            {{ errorMessage }}
          </div>
        </q-card-section>

        <q-card-section class="flex flex-center">
          <q-btn
            label="เข้าสู่ระบบ"
            class="login-btn"
            :loading="loading"
            :disable="!email || !password"
            @click="login"
          />
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import Logos from 'src/assets/Logos/Poysianlogo.png';
import { useAuthStore } from 'src/stores/useAuth';

const router = useRouter();
const auth = useAuthStore();

const email = ref('');
const password = ref('');
const loading = ref(false);
const showPassword = ref(false);
const errorMessage = ref('');

/* ------------ MOCK USER (ลบตอนมี backend) ------------ */
const mockUser = {
  email: 'admin@test.com',
  password: '123456',
  name: 'Admin',
};
/* ----------------------------------------------------- */

const login = async () => {
  if (!email.value || !password.value) {
    errorMessage.value = 'กรุณากรอกข้อมูลให้ครบ';
    return;
  }

  loading.value = true;
  errorMessage.value = '';

  try {
    // จำลอง API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    /* ------------ MOCK LOGIN ------------ */
    if (email.value === mockUser.email && password.value === mockUser.password) {
      // เก็บ token ใน Pinia
      auth.setToken('mock-jwt-token');

      // ไปหน้า dashboard
      await router.push('/dashboard');
    } else {
      errorMessage.value = 'Email หรือ Password ไม่ถูกต้อง';
    }
    /* ------------ END MOCK LOGIN ------------ */
  } catch {
    errorMessage.value = 'เกิดข้อผิดพลาด';
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

.login-wrapper {
  width: 100%;
  max-width: 420px;
  padding: 20px;
}

.logo {
  display: flex;
  justify-content: center;
}

.logo-img {
  width: 320px;
  max-width: 90%;
}

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

.error {
  color: red;
  font-size: 13px;
}

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
