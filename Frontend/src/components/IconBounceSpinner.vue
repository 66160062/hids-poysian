<template>
  <div class="icon-bounce-spinner" :style="{ width: sizeStyle, height: sizeStyle }">
    <div class="icon-bounce-spinner__glow" />
    <q-icon :name="icon" :color="color" :size="sizeStyle" class="icon-bounce-spinner__icon" />
    <div class="icon-bounce-spinner__shadow" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    icon?: string;
    color?: string;
    size?: string | number;
  }>(),
  {
    icon: 'home',
    color: 'primary',
    size: '2em',
  },
);

const sizeStyle = computed(() => (typeof props.size === 'number' ? `${props.size}px` : props.size));
</script>

<style scoped>
.icon-bounce-spinner {
  position: relative;
  display: inline-flex;
  align-items: flex-end;
  justify-content: center;
}

.icon-bounce-spinner__glow {
  position: absolute;
  inset: -20%;
  border-radius: 50%;
  background: radial-gradient(circle, currentColor 0%, transparent 70%);
  color: var(--q-primary, #1976d2);
  opacity: 0.12;
  animation: icon-glow-pulse 1.1s cubic-bezier(0.45, 0, 0.55, 1) infinite;
}

.icon-bounce-spinner__icon {
  position: relative;
  animation: icon-bounce 1.1s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
}

.icon-bounce-spinner__shadow {
  position: absolute;
  bottom: -2px;
  width: 55%;
  height: 10%;
  border-radius: 50%;
  background: currentColor;
  color: #000;
  opacity: 0.15;
  animation: icon-shadow-pulse 1.1s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
}

@keyframes icon-bounce {
  0%, 100% { transform: translateY(0) rotate(0deg) scale(1, 1); }
  30% { transform: translateY(-42%) rotate(-8deg) scale(0.92, 1.08); }
  50% { transform: translateY(-56%) rotate(0deg) scale(1, 1); }
  70% { transform: translateY(-14%) rotate(8deg) scale(1.08, 0.9); }
}

@keyframes icon-shadow-pulse {
  0%, 100% { transform: scale(1); opacity: 0.15; }
  50% { transform: scale(0.5); opacity: 0.07; }
}

@keyframes icon-glow-pulse {
  0%, 100% { transform: scale(0.75); opacity: 0.18; }
  50% { transform: scale(1.05); opacity: 0.04; }
}
</style>
