<template>
  <div class="lang-toggle" role="group" :aria-label="t('language.label')">
    <div class="lang-toggle__thumb" :style="thumbStyle" />
    <button
      v-for="option in locales"
      :key="option"
      type="button"
      class="lang-toggle__option"
      :class="{ 'lang-toggle__option--active': locale === option }"
      :aria-pressed="locale === option"
      @click="selectLocale(option)"
    >
      {{ shortLabel(option) }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { LocalStorage } from 'quasar';
import { LOCALE_STORAGE_KEY, type MessageLanguages } from 'src/boot/i18n';

const { t, locale, availableLocales } = useI18n({ useScope: 'global' });

const locales = computed(() => availableLocales as MessageLanguages[]);

const activeIndex = computed(() => Math.max(locales.value.indexOf(locale.value as MessageLanguages), 0));

const thumbStyle = computed(() => ({
  transform: `translateX(${activeIndex.value * 100}%)`,
  width: `calc((100% - 6px) / ${locales.value.length})`,
}));

function shortLabel(option: MessageLanguages) {
  return option.split('-')[0]?.toUpperCase() ?? option;
}

function selectLocale(value: MessageLanguages) {
  locale.value = value;
  LocalStorage.set(LOCALE_STORAGE_KEY, value);
}
</script>

<style scoped lang="scss">
.lang-toggle {
  position: relative;
  display: inline-flex;
  align-items: center;
  padding: 3px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.05);
}

.lang-toggle__thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  bottom: 3px;
  border-radius: 999px;
  background: var(--q-primary);
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 0;
}

.lang-toggle__option {
  position: relative;
  z-index: 1;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  padding: 6px 12px;
  border-radius: 999px;
  color: rgba(0, 0, 0, 0.55);
  transition: color 0.25s ease;
  white-space: nowrap;

  &:hover:not(&--active) {
    color: rgba(0, 0, 0, 0.75);
  }

  &--active {
    color: #fff;
  }
}
</style>
