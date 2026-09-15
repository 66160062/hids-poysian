import type { Ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { i18n } from 'src/boot/i18n';

function pickForLocale(locale: string, th: string | null | undefined, en: string | null | undefined): string {
  if (locale === 'en-US' && en) return en;
  return th || en || '';
}

// For record-level bilingual fields (e.g. a job's Thai/English project name,
// or a floor/house type's label/labelEn, name/nameEn) — prefer the English
// value when present and fall back to Thai (older records won't have an
// English value filled in yet).
export function useLocalizedField() {
  const { locale } = useI18n({ useScope: 'global' });

  function pickLocalized(th: string | null | undefined, en: string | null | undefined): string {
    return pickForLocale(locale.value, th, en);
  }

  return { pickLocalized };
}

// Same rule for records shaped { name, nameEn } (defect categories/sub-categories).
// Reads the global i18n locale directly so it also works outside setup() — Pinia
// stores and plain helpers — and stays reactive when called from a template/computed.
export function localizedName(item: { name?: string | null; nameEn?: string | null } | null | undefined): string {
  // legacy: false ทำให้ locale เป็น ref ตอน runtime แต่ type ของ i18n.global ประกาศเป็น string union
  return pickForLocale((i18n.global.locale as unknown as Ref<string>).value, item?.name, item?.nameEn);
}
