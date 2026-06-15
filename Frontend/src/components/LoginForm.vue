<template>
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
        @click="handleLogin"
      />
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'src/stores/useAuth';

const router = useRouter();
const auth = useAuthStore();

const email = ref('');
const password = ref('');
const loading = ref(false);
const showPassword = ref(false);
const errorMessage = ref('');

const handleLogin = async () => {
  loading.value = true;
  errorMessage.value = '';

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
    errorMessage.value = 'Email หรือ Password ไม่ถูกต้อง';
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
