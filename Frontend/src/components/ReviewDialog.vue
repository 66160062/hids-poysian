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
          :disable="form.rating === 0"
          :loading="isSubmitting"
          @click="submitRating"
        />
      </q-card-actions>

    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'src/boot/axios'
import { useLinkAccess } from 'src/stores/useLinkAccess'
import StarRating from 'src/components/StarRating.vue'

const dialog = defineModel<boolean>({ default: false })
const emit = defineEmits<{ (event: 'closed'): void }>()
const $q = useQuasar()
const { linkToken } = useLinkAccess()
const isSubmitting = ref(false)

const form = reactive({
  rating: 0,
  comment: '',
});

const submitRating = async () => {
  if (!linkToken.value || isSubmitting.value) return

  isSubmitting.value = true
  try {
    await api.post('/ratings', {
      score: form.rating,
      comment: form.comment,
      token: linkToken.value,
    })
    $q.notify({ type: 'positive', message: 'ขอบคุณสำหรับคำแนะนำ' })
    form.rating = 0
    form.comment = ''
    dialog.value = false
  } catch (error) {
    console.error('Unable to submit rating:', error)
    const isDuplicate =
      typeof error === 'object' &&
      error !== null &&
      'response' in error &&
      (error as { response?: { status?: number } }).response?.status === 409
    $q.notify({
      type: 'negative',
      message: isDuplicate
        ? 'ลิงก์นี้ส่งรีวิวไปแล้ว'
        : 'ไม่สามารถส่งรีวิวได้ กรุณาลองใหม่',
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>
