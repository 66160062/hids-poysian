<template>
  <div class="column q-gutter-y-lg">
    <section aria-labelledby="cr-accident-title">
      <h2 id="cr-accident-title" class="cr-section-title">{{ t('construction.report.safety.accidentTitle') }}</h2>
      <div id="cr-accident-q" class="q-mb-sm">{{ t('construction.report.safety.accidentQuestion') }}</div>
      <div class="cr-yesno" role="group" aria-labelledby="cr-accident-q">
        <button type="button" class="cr-yesno__btn" :class="{ 'cr-yesno__btn--ok': form.accidentCount === 0 }" :aria-pressed="form.accidentCount === 0" @click="form.accidentCount = 0">
          <q-icon name="verified_user" size="22px" aria-hidden="true" />
          {{ t('construction.report.safety.no') }}
        </button>
        <button type="button" class="cr-yesno__btn" :class="{ 'cr-yesno__btn--alert': form.accidentCount > 0 }" :aria-pressed="form.accidentCount > 0" @click="form.accidentCount = Math.max(1, form.accidentCount)">
          <q-icon name="personal_injury" size="22px" aria-hidden="true" />
          {{ t('construction.report.safety.yes') }}
        </button>
      </div>
      <div v-if="form.accidentCount > 0" class="cr-card q-mt-sm">
        <div class="cr-label">{{ t('construction.report.safety.accidentCount') }}</div>
        <CountStepper v-model="form.accidentCount" :min="1" :label="t('construction.report.safety.accidentCount')" />
      </div>
    </section>

    <section aria-labelledby="cr-issues-title">
      <h2 id="cr-issues-title" class="cr-section-title">{{ t('construction.report.safety.issuesTitle') }}</h2>
      <div v-if="form.issues.length === 0 && !composerOpen" class="text-grey-7 q-mb-sm">{{ t('construction.report.safety.issuesEmpty') }}</div>

      <div v-for="issue in form.issues" :key="issue.id" class="cr-card q-mb-sm">
        <div class="row items-start no-wrap">
          <div class="col cr-issue-text">{{ issue.text }}</div>
          <q-btn flat round icon="delete_outline" color="negative" class="cr-tap" :aria-label="t('construction.report.safety.removeIssue')" @click="removeIssue(issue.id)" />
        </div>
        <div class="row q-gutter-xs q-mt-xs" role="group" :aria-label="t('construction.report.safety.issueStatus')">
          <button
            v-for="s in statusOptions"
            :key="s.value"
            type="button"
            class="cr-chip"
            :class="{ 'cr-chip--active': issue.status === s.value }"
            :aria-pressed="issue.status === s.value"
            @click="issue.status = s.value"
          >
            {{ s.label }}
          </button>
        </div>
      </div>

      <div v-if="composerOpen" class="cr-card q-mb-sm">
        <q-input
          v-model="newText"
          outlined
          autogrow
          autofocus
          type="textarea"
          :label="t('construction.report.safety.issueText')"
          :placeholder="t('construction.report.safety.issuePlaceholder')"
          :error="textError"
          :error-message="t('construction.report.safety.issueRequired')"
          @update:model-value="textError = false"
        />
        <div class="cr-label q-mt-sm">{{ t('construction.report.safety.issueStatus') }}</div>
        <div class="row q-gutter-xs" role="group" :aria-label="t('construction.report.safety.issueStatus')">
          <button
            v-for="s in statusOptions"
            :key="s.value"
            type="button"
            class="cr-chip"
            :class="{ 'cr-chip--active': newStatus === s.value }"
            :aria-pressed="newStatus === s.value"
            @click="newStatus = s.value"
          >
            {{ s.label }}
          </button>
        </div>
        <div class="row q-gutter-x-sm q-mt-md">
          <q-btn flat no-caps color="grey-8" class="col cr-tap-btn" :label="t('construction.report.safety.cancel')" @click="composerOpen = false" />
          <q-btn unelevated no-caps color="primary" class="col cr-tap-btn" :label="t('construction.report.safety.saveIssue')" @click="saveIssue" />
        </div>
      </div>

      <q-btn v-if="!composerOpen" outline no-caps color="primary" icon="add" :label="t('construction.report.safety.addIssue')" class="full-width cr-tap-btn" @click="openComposer" />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import CountStepper from './CountStepper.vue';
import { useConstructionReport } from 'src/composables/constructionReport/useConstructionReport';
import { ISSUE_STATUS_VALUES, newId } from 'src/composables/constructionReport/reportForm';

const { t } = useI18n();
const { form } = useConstructionReport();

// value = ข้อความไทยที่บันทึกลงฐานข้อมูลตามเดิม
const statusOptions = computed(() => [
  { value: ISSUE_STATUS_VALUES[0], label: t('construction.inspect.noteStatusFollowUp') },
  { value: ISSUE_STATUS_VALUES[1], label: t('construction.inspect.noteStatusPending') },
  { value: ISSUE_STATUS_VALUES[2], label: t('construction.inspect.noteStatusAcknowledged') },
]);

const composerOpen = ref(false);
const newText = ref('');
const newStatus = ref<string>(ISSUE_STATUS_VALUES[0]);
const textError = ref(false);

function openComposer() {
  newText.value = '';
  newStatus.value = ISSUE_STATUS_VALUES[0];
  textError.value = false;
  composerOpen.value = true;
}
function saveIssue() {
  const text = newText.value.trim();
  if (!text) {
    textError.value = true;
    return;
  }
  form.value.issues.push({ id: newId(), text, status: newStatus.value });
  composerOpen.value = false;
}
function removeIssue(id: string) {
  form.value.issues = form.value.issues.filter((i) => i.id !== id);
}
</script>

<style scoped>
.cr-yesno {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.cr-yesno__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 56px;
  border: 1px solid #cfd8dc;
  border-radius: 12px;
  background: #fff;
  color: #455a64;
  font: inherit;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}
.cr-yesno__btn:focus-visible {
  outline: 2px solid var(--q-primary);
  outline-offset: 2px;
}
.cr-yesno__btn--ok {
  border: 2px solid #2e7d32;
  background: #e8f5e9;
  color: #1b5e20;
}
.cr-yesno__btn--alert {
  border: 2px solid #c62828;
  background: #ffebee;
  color: #b71c1c;
}
.cr-issue-text {
  white-space: pre-wrap;
  line-height: 1.5;
  padding-top: 10px;
}
</style>
