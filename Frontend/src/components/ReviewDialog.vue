<template>
  <q-dialog v-model="dialog" position="bottom" @hide="emit('closed')">
    <q-card style="width: 100%; max-width: 480px; border-radius: 16px 16px 0 0;">

      <!-- Header -->
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6 text-weight-bold">{{ t('components.reviewDialog.title') }}</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>

        <div class="text-subtitle2 q-mb-sm">{{ t('components.reviewDialog.satisfaction') }}</div>
        <StarRating v-model="form.rating" class="q-mb-md" />

        <div class="text-subtitle2 q-mb-sm">{{ t('components.reviewDialog.additionalComment') }}</div>
        <q-input
          v-model="form.comment"
          type="textarea"
          outlined
          dense
          rows="4"
          :placeholder="t('components.reviewDialog.commentPlaceholder')"
          bg-color="grey-1"
          maxlength="500"
          counter
        />

      </q-card-section>

      <!-- Actions -->
      <q-card-actions class="q-px-md q-pb-md">
        <q-btn
          flat
          :label="t('components.reviewDialog.cancel')"
          color="grey-7"
          class="col"
          v-close-popup
        />
        <q-btn
          unelevated
          :label="t('components.reviewDialog.submit')"
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
import { useI18n } from 'vue-i18n'
import { api } from 'src/boot/axios'
import { useLinkAccess } from 'src/stores/useLinkAccess'
import StarRating from 'src/components/StarRating.vue'

const dialog = defineModel<boolean>({ default: false })
const emit = defineEmits<{ (event: 'closed'): void }>()
const $q = useQuasar()
const { t } = useI18n()
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
    $q.notify({ type: 'positive', message: t('components.reviewDialog.thankYou') })
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
        ? t('components.reviewDialog.alreadySubmitted')
        : t('components.reviewDialog.submitError'),
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>
