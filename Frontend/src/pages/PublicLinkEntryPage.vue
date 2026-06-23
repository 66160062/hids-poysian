<template>
  <q-page class="bg-grey-1 column items-center justify-center q-pa-md">
    <div v-if="isVerifying" class="column items-center">
      <q-spinner color="primary" size="3em" />
      <div class="text-grey-6 q-mt-md">กำลังตรวจสอบลิงก์...</div>
    </div>

    <q-card v-else-if="errorMessage" flat bordered class="card-round q-pa-lg text-center" style="max-width: 360px">
      <q-icon name="link_off" size="48px" color="negative" class="q-mb-md" />
      <div class="text-subtitle1 text-weight-bold q-mb-sm">ลิงก์ไม่ถูกต้องหรือหมดอายุ</div>
      <div class="text-body2 text-grey-7">{{ errorMessage }}</div>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { useLinkAccess, type LinkAccessPayload, type LinkAccessRole } from 'src/stores/useLinkAccess';

const props = defineProps<{
  expectedRole: LinkAccessRole;
  redirectPath: string;
}>();

const route = useRoute();
const router = useRouter();
const { setAccess } = useLinkAccess();

const isVerifying = ref(true);
const errorMessage = ref('');

function extractProjectId(): number | null {
  const slug = route.params.slug as string | undefined;
  if (!slug) return null;

  const match = slug.match(/^prj-(\d+)/);
  return match?.[1] ? Number(match[1]) : null;
}

onMounted(async () => {
  const token = route.query.token;
  const projectId = extractProjectId();

  if (typeof token !== 'string' || !token || !projectId) {
    isVerifying.value = false;
    errorMessage.value = 'ลิงก์ไม่ครบถ้วน กรุณาขอลิงก์ใหม่จากผู้ดูแลระบบ';
    return;
  }

  try {
    const { data } = await axios.get<{
      valid: boolean;
      payload: { project_id: number; role: string; exp?: number };
    }>(`${import.meta.env.VITE_API_URL}/auth/verify-link`, {
      params: { token },
    });

    const payload = data.payload;
    if (
      payload.project_id !== projectId ||
      payload.role !== props.expectedRole
    ) {
      throw new Error('invalid role or project');
    }

    const accessPayload: LinkAccessPayload = {
      project_id: payload.project_id,
      role: props.expectedRole,
    };
    if (payload.exp !== undefined) {
      accessPayload.exp = payload.exp;
    }

    setAccess(accessPayload, token);

    await router.replace({
      path: props.redirectPath,
      query: { jobId: String(projectId) },
    });
  } catch (err) {
    isVerifying.value = false;
    const message =
      err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
    errorMessage.value =
      message || 'ลิงก์หมดอายุหรือไม่ถูกต้อง กรุณาขอลิงก์ใหม่จากผู้ดูแลระบบ';
  }
});
</script>

<style scoped>
.card-round {
  border-radius: 16px;
  border-color: #eeeeee;
}
</style>
