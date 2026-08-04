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

const labels: Record<number, string> = {
  1: 'แย่มาก',
  2: 'แย่',
  3: 'พอใช้',
  4: 'ดี',
  5: 'ดีมาก',
};

const ratingLabel = computed(() => labels[rating.value] ?? 'เลือกคะแนน');
</script>

<style scoped>
.star-rating {
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
