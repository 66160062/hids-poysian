<template>
  <div class="star-rating">
    <q-rating
      v-model="rating"
      :max="max"
      :size="size"
      :readonly="readonly"
      color="amber"
      icon="star_border"
      icon-selected="star"
      no-dimming
    />
    <div v-if="showLabel" class="text-center text-caption text-grey-6 q-mt-xs">
      {{ ratingLabel }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const rating = defineModel<number>({ default: 0 });

withDefaults(
  defineProps<{
    max?: number;
    size?: string;
    readonly?: boolean;
    showLabel?: boolean;
  }>(),
  {
    max: 5,
    size: '2.5em',
    readonly: false,
    showLabel: true,
  },
);

const labels = computed<Record<number, string>>(() => ({
  1: t('components.starRating.rating1'),
  2: t('components.starRating.rating2'),
  3: t('components.starRating.rating3'),
  4: t('components.starRating.rating4'),
  5: t('components.starRating.rating5'),
}));

const ratingLabel = computed(() => labels.value[rating.value] ?? t('components.starRating.selectRating'));
</script>

<style scoped>
.star-rating {
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
