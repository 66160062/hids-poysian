<template>
  <q-dialog v-model="dialog" position="bottom" @hide="emit('closed')">
    <q-card style="width: 100%; max-width: 480px; border-radius: 16px 16px 0 0;">

      <!-- Header -->
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6 text-weight-bold">รีวิวและให้คะแนน</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>

        <div class="text-subtitle2 q-mb-sm">ความพึงพอใจ</div>
        <StarRating v-model="form.rating" class="q-mb-md" />

        <div class="text-subtitle2 q-mb-sm">ความคิดเห็นเพิ่มเติม</div>
        <q-input
          v-model="form.comment"
          type="textarea"
          outlined
          dense
          rows="4"
          placeholder="บอกเล่าประสบการณ์ที่ได้รับ..."
          bg-color="grey-1"
          maxlength="500"
          counter
        />

      </q-card-section>

      <!-- Actions -->
      <q-card-actions class="q-px-md q-pb-md">
        <q-btn
          flat
          label="ยกเลิก"
          color="grey-7"
          class="col"
          v-close-popup
        />
        <q-btn
          unelevated
          label="ส่งรีวิว"
          color="primary"
          class="col"
          :loading="isSubmitting"
          :disable="form.rating === 0 || isSubmitting"
          @click="submit"
        />
      </q-card-actions>

    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import StarRating from 'src/components/StarRating.vue';

const dialog = defineModel<boolean>({ default: false });

const props = defineProps<{
  jobId?: number | null;
  roundId?: number | null;
  defectId?: number | null;
}>();

const emit = defineEmits<{
  submitted: [];
  closed: [];
}>();

const $q = useQuasar();
const isSubmitting = ref(false);

const form = reactive({
  rating: 0,
  comment: '',
});

watch(dialog, (isOpen) => {
  if (!isOpen) return;
  form.rating = 0;
  form.comment = '';
});

const submit = async () => {
  if (form.rating === 0 || isSubmitting.value) return;

  isSubmitting.value = true;
  try {
    await api.post('/ratings', {
      jobId: props.jobId ?? undefined,
      roundId: props.roundId ?? undefined,
      defectId: props.defectId ?? undefined,
      rating: form.rating,
      comment: form.comment.trim(),
    });

    $q.notify({ type: 'positive', message: 'ส่งรีวิวเรียบร้อยแล้ว' });
    dialog.value = false;
    emit('submitted');
  } catch (error) {
    console.error(error);
    $q.notify({ type: 'negative', message: 'ส่งรีวิวไม่สำเร็จ กรุณาลองใหม่' });
  } finally {
    isSubmitting.value = false;
  }
};
</script>
