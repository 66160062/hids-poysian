<template>
  <q-dialog v-model="dialog" position="bottom">
    <q-card style="width: 100%; max-width: 480px; border-radius: 16px 16px 0 0;">

      <!-- Header -->
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6 text-weight-bold">{{ t('components.reviewDialog.title') }}</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>

        <!-- Rating Stars -->
        <div class="text-subtitle2 q-mb-sm">{{ t('components.reviewDialog.satisfaction') }}</div>
        <div class="row justify-center q-mb-md">
          <q-rating
            v-model="form.rating"
            size="2.5em"
            color="amber"
            icon="star_border"
            icon-selected="star"
          />
        </div>
        <div class="text-center text-caption text-grey-6 q-mb-md">{{ ratingLabel }}</div>

        <!-- Comment -->
        <div class="text-subtitle2 q-mb-sm">{{ t('components.reviewDialog.additionalComment') }}</div>
        <q-input
          v-model="form.comment"
          type="textarea"
          outlined
          dense
          rows="4"
          :placeholder="t('components.reviewDialog.commentPlaceholder')"
          bg-color="grey-1"
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
          @click="submit"
        />
      </q-card-actions>

    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const dialog = defineModel<boolean>({ default: false })

const form = ref({
  rating:  0,
  comment: '',
})

const ratingLabel = computed(() => {
  const labels: Record<number, string> = {
    1: t('components.reviewDialog.rating1'),
    2: t('components.reviewDialog.rating2'),
    3: t('components.reviewDialog.rating3'),
    4: t('components.reviewDialog.rating4'),
    5: t('components.reviewDialog.rating5'),
  }
  return labels[form.value.rating] ?? t('components.reviewDialog.selectRating')
})

const submit = () => {
  // TODO: เชื่อม API POST /api/reviews
  // await fetch('/api/reviews', {
  //   method: 'POST',
  //   body: JSON.stringify({ jobId, rating: form.value.rating, comment: form.value.comment })
  // })
  console.log('submit review:', form.value)
  dialog.value = false
}
</script>