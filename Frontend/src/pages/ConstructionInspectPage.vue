<template>
  <q-layout view="lHh Lpr lFf">
    <q-header v-if="isAdmin" class="bg-white" bordered>
      <div class="row items-center q-py-sm q-px-sm">
        <q-btn flat round icon="arrow_back_ios_new" color="primary" class="cr-tap" :aria-label="t('construction.report.back')" @click="router.back()" />
        <div class="text-h6 text-weight-bold q-ml-xs text-primary">{{ t('construction.inspect.headerTitleEdit') }}</div>
      </div>
    </q-header>

    <q-page-container>
      <q-page class="cr-page">
        <div class="cr-content">
          <ReportStepNav :steps="navSteps" :current="step" @go="goTo" />

          <div v-if="!isOnline" class="cr-banner cr-banner--offline q-mt-sm" role="status">
            <q-icon name="cloud_off" size="20px" aria-hidden="true" />
            <span>{{ t('construction.report.offline') }}</span>
          </div>
          <div v-if="restoredDraftAt" class="cr-banner cr-banner--info q-mt-sm" role="status">
            <q-icon name="restore" size="20px" aria-hidden="true" />
            <span class="col">{{ t('construction.report.draft.restored', { time: formatTime(restoredDraftAt) }) }}</span>
            <q-btn flat dense no-caps color="primary" class="cr-fix-btn" :label="t('construction.report.draft.discard')" @click="confirmDiscard" />
          </div>

          <div class="q-mt-md">
            <StepGeneral v-if="currentKey === 'general'" />
            <StepWork v-else-if="currentKey === 'work'" />
            <StepCrew v-else-if="currentKey === 'crew'" />
            <StepSafety v-else-if="currentKey === 'safety'" />
            <StepPhotos v-else-if="currentKey === 'photos'" />
            <StepReview v-else @go="goTo" />
          </div>
        </div>
      </q-page>
    </q-page-container>

    <q-footer class="cr-footer">
      <div class="cr-footer__inner">
        <div class="cr-footer__status" role="status" aria-live="polite">
          <template v-if="draftSaveFailed">
            <q-icon name="warning" size="14px" color="negative" aria-hidden="true" />
            <span class="text-negative">{{ t('construction.report.draft.failed') }}</span>
          </template>
          <template v-else-if="draftSavedAt">
            <q-icon name="save" size="14px" aria-hidden="true" />
            {{ t('construction.report.draft.saved', { time: formatTime(draftSavedAt) }) }}
          </template>
        </div>
        <div class="row no-wrap q-gutter-x-sm">
          <q-btn
            v-if="step > 0"
            outline
            no-caps
            color="primary"
            icon="chevron_left"
            :label="t('construction.report.back')"
            class="cr-footer__back"
            @click="goTo(step - 1)"
          />
          <q-btn
            v-if="!isLastStep"
            unelevated
            no-caps
            color="primary"
            icon-right="chevron_right"
            :label="t('construction.report.next')"
            class="col cr-footer__main"
            @click="goTo(step + 1)"
          />
          <q-btn
            v-else
            unelevated
            no-caps
            color="primary"
            icon="send"
            :label="submitLabel"
            class="col cr-footer__main"
            :loading="store.isSubmitting"
            :disable="store.isSubmitting || (isEditMode && !isDirty)"
            @click="onSubmit"
          />
        </div>
      </div>
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import ReportStepNav from 'src/components/constructionReport/ReportStepNav.vue';
import type { StepNavItem } from 'src/components/constructionReport/ReportStepNav.vue';
import StepGeneral from 'src/components/constructionReport/StepGeneral.vue';
import StepWork from 'src/components/constructionReport/StepWork.vue';
import StepCrew from 'src/components/constructionReport/StepCrew.vue';
import StepSafety from 'src/components/constructionReport/StepSafety.vue';
import StepPhotos from 'src/components/constructionReport/StepPhotos.vue';
import StepReview from 'src/components/constructionReport/StepReview.vue';
import { provideConstructionReport, STEP_KEYS } from 'src/composables/constructionReport/useConstructionReport';
import { createIconSpinner } from 'src/composables/useIconSpinner';

// รายงานก่อสร้างประจำวันแบบทีละขั้น ออกแบบให้กรอกบนมือถือมือเดียวได้
// state ทั้งหมดอยู่ใน useConstructionReport (บันทึกร่างลงเครื่องอัตโนมัติ) — หน้านี้ดูแลแค่การนำทางและการส่ง
const spinner = createIconSpinner('construction');

const $q = useQuasar();
const router = useRouter();
const route = useRoute();
const { t } = useI18n();

const isAdmin = route.path.startsWith('/admin');
const roundId = Number(route.params.roundId);

const report = provideConstructionReport(roundId);
const {
  store,
  step,
  isEditMode,
  isDirty,
  isOnline,
  draftSavedAt,
  draftSaveFailed,
  restoredDraftAt,
  problems,
  blockingProblems,
} = report;

const currentKey = computed(() => STEP_KEYS[step.value] ?? 'general');
const isLastStep = computed(() => step.value === STEP_KEYS.length - 1);
const submitLabel = computed(() => {
  if (isEditMode.value && !isDirty.value) return t('construction.report.noChanges');
  return isAdmin || isEditMode.value ? t('construction.report.submitEdit') : t('construction.report.submitDaily');
});

const navSteps = computed<StepNavItem[]>(() =>
  STEP_KEYS.map((key, i) => {
    const hasBlocking = problems.value.some((p) => p.step === key && p.level === 'blocking');
    // แสดงสถานะ "ต้องแก้" เฉพาะขั้นที่ผ่านมาแล้ว — ไม่ขึ้นสีแดงตั้งแต่ยังไม่ได้เริ่มกรอก
    const visited = i < step.value || isLastStep.value;
    let state: StepNavItem['state'] = 'todo';
    if (key !== 'review' && visited) state = hasBlocking ? 'error' : 'done';
    return { key, label: t(`construction.report.steps.${key}`), state };
  }),
);

function goTo(index: number) {
  if (index < 0 || index >= STEP_KEYS.length || index === step.value) return;
  step.value = index;
  void nextTick(() => {
    window.scrollTo({ top: 0 });
    document.getElementById('cr-step-title')?.focus({ preventScroll: true });
  });
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function confirmDiscard() {
  $q.dialog({
    title: t('construction.report.draft.discardTitle'),
    message: t('construction.report.draft.discardMessage'),
    ok: { label: t('construction.report.draft.discard'), color: 'negative', unelevated: true, noCaps: true },
    cancel: { label: t('construction.report.draft.keep'), flat: true, noCaps: true, color: 'grey-8' },
  }).onOk(() => {
    void withLoading(report.discardDraft);
  });
}

async function withLoading(run: () => Promise<void>) {
  $q.loading.show({ spinner, spinnerColor: 'primary', spinnerSize: 70, backgroundColor: 'white' });
  try {
    await run();
  } finally {
    $q.loading.hide();
  }
}

async function onSubmit() {
  if (blockingProblems.value.length > 0) {
    $q.notify({ message: t('construction.report.submit.fixFirst'), color: 'warning', textColor: 'dark', icon: 'warning' });
    return;
  }
  const result = await report.submit();
  if (result.ok) {
    $q.notify({
      message: isAdmin || isEditMode.value ? t('construction.report.submit.editSuccess') : t('construction.report.submit.success'),
      color: 'positive',
      icon: 'check_circle',
    });
    router.back();
    return;
  }
  if (result.reason === 'invalid') return;
  $q.notify({
    message: result.reason === 'offline' ? t('construction.report.submit.offline') : (result.message ?? t('construction.report.submit.error')),
    color: 'negative',
    icon: result.reason === 'offline' ? 'cloud_off' : 'error',
    timeout: 6000,
  });
}

// ล็อกจอหรือสลับแอปบนมือถือ → บันทึกร่างทันที ไม่รอ debounce
function onVisibilityChange() {
  if (document.visibilityState === 'hidden') void report.flushDraft();
}

onMounted(() => {
  document.addEventListener('visibilitychange', onVisibilityChange);
  if (roundId) void withLoading(report.load);
});
onUnmounted(() => {
  document.removeEventListener('visibilitychange', onVisibilityChange);
});
</script>

<style>
/* คลาสร่วมของหน้ารายงานก่อสร้าง (ใช้ในคอมโพเนนต์ src/components/constructionReport/*) */
.cr-page {
  background: #f5f7fa;
  padding: 16px 16px 140px;
  line-height: 1.5;
  font-family: 'Inter', 'Noto Sans Thai', -apple-system, BlinkMacSystemFont, sans-serif;
}
.cr-content {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}
.cr-section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.5;
  color: #263238;
}
.cr-label {
  display: block;
  margin-bottom: 4px;
  font-size: 14px;
  line-height: 1.5;
  color: #546e7a;
}
.cr-card {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 12px;
}
.cr-card--attention {
  border-color: #ffb74d;
  box-shadow: inset 4px 0 0 #fb8c00;
}
.cr-card--info {
  border-color: #90caf9;
  background: #f3f8ff;
}
.cr-card--error {
  border-color: #ef9a9a;
  background: #fff5f5;
}
.cr-card--warning {
  border-color: #ffe082;
  background: #fffbea;
}
.cr-card__title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.5;
  color: #263238;
  word-break: break-word;
}
.cr-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 14px;
  line-height: 1.5;
}
.cr-banner--warning {
  background: #fff3e0;
  color: #8a4b00;
}
.cr-banner--info {
  background: #e3f2fd;
  color: #0d47a1;
}
.cr-banner--offline {
  background: #eceff1;
  color: #37474f;
}
.cr-banner--ok {
  background: #e8f5e9;
  color: #1b5e20;
  font-weight: 600;
}
.cr-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px 12px;
  text-align: center;
  color: #607d8b;
  background: #fff;
  border: 1px dashed #cfd8dc;
  border-radius: 12px;
}
.cr-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0 8px;
  border-radius: 10px;
  font-size: 12px;
  line-height: 1.6;
}
.cr-tag--warning {
  background: #fff3e0;
  color: #8a4b00;
  font-weight: 600;
}
.cr-chip {
  min-height: 40px;
  padding: 0 14px;
  border: 1px solid #cfd8dc;
  border-radius: 20px;
  background: #fff;
  color: #37474f;
  font: inherit;
  font-size: 14px;
  line-height: 1.5;
  cursor: pointer;
}
.cr-chip:focus-visible {
  outline: 2px solid var(--q-primary);
  outline-offset: 2px;
}
.cr-chip--active {
  background: var(--q-primary);
  border-color: var(--q-primary);
  color: #fff;
  font-weight: 600;
}
.cr-tap {
  min-width: 48px;
  min-height: 48px;
}
.cr-tap-btn {
  min-height: 48px;
  border-radius: 10px;
}
.cr-primary-btn {
  min-height: 52px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
}
.cr-fix-btn {
  min-height: 44px;
  padding: 0 12px;
}
.cr-thumb {
  width: 56px;
  height: 48px;
  border-radius: 8px;
  object-fit: cover;
  flex: none;
}
.cr-sheet {
  width: 100vw;
  max-width: 600px;
  max-height: 90vh;
  border-radius: 20px 20px 0 0 !important;
  display: flex;
  flex-direction: column;
}
.cr-sheet__handle {
  width: 40px;
  height: 4px;
  margin: 8px auto 0;
  border-radius: 2px;
  background: #cfd8dc;
}
.cr-sheet__title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.5;
}
.cr-sheet__body {
  overflow-y: auto;
}
.cr-sheet__actions {
  padding: 8px 16px calc(16px + env(safe-area-inset-bottom));
}
.cr-footer {
  background: #fff;
  color: #455a64;
  border-top: 1px solid #e0e0e0;
}
.cr-footer__inner {
  max-width: 600px;
  margin: 0 auto;
  padding: 6px 16px calc(12px + env(safe-area-inset-bottom));
}
.cr-footer__status {
  display: flex;
  align-items: center;
  gap: 4px;
  min-height: 20px;
  margin-bottom: 4px;
  font-size: 12px;
  line-height: 1.5;
  color: #607d8b;
}
.cr-footer__back {
  min-height: 52px;
  min-width: 112px;
  border-radius: 12px;
}
.cr-footer__main {
  min-height: 52px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
}
@media (prefers-reduced-motion: reduce) {
  .cr-page * {
    scroll-behavior: auto !important;
    transition: none !important;
  }
}
</style>
