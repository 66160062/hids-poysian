<template>
  <nav class="step-nav" :aria-label="t('construction.report.stepsNav')">
    <div class="row items-center justify-between q-mb-xs">
      <h1 id="cr-step-title" tabindex="-1" class="text-subtitle1 text-weight-bold text-dark step-nav__title">{{ steps[current]?.label }}</h1>
      <div class="text-caption text-grey-8">{{ t('construction.report.stepOf', { current: current + 1, total: steps.length }) }}</div>
    </div>
    <q-linear-progress
      :value="(current + 1) / steps.length"
      color="primary"
      track-color="grey-3"
      rounded
      size="6px"
      class="q-mb-sm"
      aria-hidden="true"
    />
    <ol ref="listEl" class="step-nav__list">
      <li v-for="(s, i) in steps" :key="s.key">
        <button
          type="button"
          class="step-nav__chip"
          :class="{
            'step-nav__chip--active': i === current,
            'step-nav__chip--error': s.state === 'error',
            'step-nav__chip--done': s.state === 'done',
          }"
          :aria-current="i === current ? 'step' : undefined"
          @click="emit('go', i)"
        >
          <q-icon v-if="s.state === 'done'" name="check_circle" size="18px" />
          <q-icon v-else-if="s.state === 'error'" name="error" size="18px" />
          <span v-else class="step-nav__num" aria-hidden="true">{{ i + 1 }}</span>
          <span>{{ s.label }}</span>
          <span v-if="s.state !== 'todo'" class="sr-only">
            ({{ s.state === 'done' ? t('construction.report.stepDone') : t('construction.report.stepNeedsFix') }})
          </span>
        </button>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

export interface StepNavItem {
  key: string;
  label: string;
  state: 'done' | 'error' | 'todo';
}

const props = defineProps<{ steps: StepNavItem[]; current: number }>();
const emit = defineEmits<{ go: [index: number] }>();
const { t } = useI18n();

const listEl = ref<HTMLOListElement | null>(null);

// เลื่อนแถบขั้นตอนให้เห็นขั้นปัจจุบันเสมอ (จอ 375px แสดงได้ไม่ครบทุกขั้น)
watch(
  () => props.current,
  async (i) => {
    await nextTick();
    const list = listEl.value;
    const chip = list?.children[i] as HTMLElement | undefined;
    if (!list || !chip) return;
    // เลื่อนเฉพาะแถบ chip — scrollIntoView จะเลื่อนทั้งหน้าไปด้านข้างด้วย
    list.scrollTo({ left: chip.offsetLeft - (list.clientWidth - chip.offsetWidth) / 2, behavior: 'smooth' });
  },
);
</script>

<style scoped>
.step-nav__title {
  margin: 0;
  font-size: 18px;
  line-height: 1.5;
}
.step-nav__title:focus {
  outline: none;
}
.step-nav__title:focus-visible {
  outline: 2px solid var(--q-primary);
  outline-offset: 2px;
}
.step-nav__list {
  position: relative;
  display: flex;
  gap: 8px;
  overflow-x: auto;
  list-style: none;
  margin: 0;
  padding: 2px 2px 6px;
  scrollbar-width: none;
}
.step-nav__list::-webkit-scrollbar {
  display: none;
}
.step-nav__chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 40px;
  padding: 0 14px;
  border-radius: 20px;
  border: 1px solid #cfd8dc;
  background: #fff;
  color: #455a64;
  font: inherit;
  font-size: 14px;
  line-height: 1.5;
  white-space: nowrap;
  cursor: pointer;
}
.step-nav__chip:focus-visible {
  outline: 2px solid var(--q-primary);
  outline-offset: 2px;
}
.step-nav__chip--done {
  color: #2e7d32;
  border-color: #a5d6a7;
}
.step-nav__chip--error {
  color: #c62828;
  border-color: #ef9a9a;
}
.step-nav__chip--active {
  background: var(--q-primary);
  border-color: var(--q-primary);
  color: #fff;
  font-weight: 600;
}
.step-nav__num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px solid currentColor;
  font-size: 12px;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
</style>
