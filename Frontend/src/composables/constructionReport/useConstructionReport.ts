// state กลางของหน้ารายงานก่อสร้างประจำวัน (ทุก step ใช้ร่วมกันผ่าน provide/inject)
import { computed, inject, onUnmounted, provide, ref, watch } from 'vue';
import type { InjectionKey } from 'vue';
import { useConstructionDailyReportStore } from 'src/stores/useConstructionDailyReport';
import type { PreviousRoundCrew } from 'src/stores/useConstructionDailyReport';
import {
  applyPreviousCrew,
  buildPayload,
  emptyForm,
  formFromReport,
  newId,
  splitWorkingPeriod,
  validateReport,
  worksFromPrevious,
} from './reportForm';
import type { ReportForm, ReportPhoto, StepKey } from './reportForm';
import { clearDraft, loadDraft, saveDraft } from './useReportDraft';
import type { DraftPhoto } from './useReportDraft';

export const STEP_KEYS: StepKey[] = ['general', 'work', 'crew', 'safety', 'photos', 'review'];

const API_BASE_URL = import.meta.env.VITE_API_URL as string;
const AUTOSAVE_DELAY_MS = 600;

async function urlToFile(url: string, filename: string): Promise<File | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type || 'image/jpeg' });
  } catch {
    return null;
  }
}

function makePhoto(file: File, workId: string | null, id = newId()): ReportPhoto {
  return { id, workId, file, preview: URL.createObjectURL(file) };
}

export type SubmitResult = { ok: true } | { ok: false; reason: 'invalid' | 'offline' | 'server'; message?: string | undefined };

export function createConstructionReport(roundId: number) {
  const store = useConstructionDailyReportStore();

  const form = ref<ReportForm>(emptyForm());
  const panorama = ref<ReportPhoto | null>(null);
  const photos = ref<ReportPhoto[]>([]);
  const step = ref(0);

  const isLoading = ref(false);
  const isEditMode = ref(false);
  const isCarriedForward = ref(false);
  const previousCrew = ref<PreviousRoundCrew | null>(null);

  const draftSavedAt = ref<number | null>(null);
  const draftSaveFailed = ref(false);
  const restoredDraftAt = ref<number | null>(null);
  const initialSnapshot = ref('');

  const isOnline = ref(typeof navigator === 'undefined' ? true : navigator.onLine);
  const setOnline = () => (isOnline.value = true);
  const setOffline = () => (isOnline.value = false);
  window.addEventListener('online', setOnline);
  window.addEventListener('offline', setOffline);

  // ── photos ────────────────────────────────────────────────
  function revoke(photo: ReportPhoto | null | undefined) {
    if (photo?.preview) URL.revokeObjectURL(photo.preview);
  }
  function setPanorama(file: File) {
    revoke(panorama.value);
    panorama.value = makePhoto(file, null);
  }
  function removePanorama() {
    revoke(panorama.value);
    panorama.value = null;
  }
  /** 1 งาน = 1 รูป (รูปใหม่แทนที่รูปเดิม) ตามรูปแบบรายงาน PDF */
  function setWorkPhoto(workId: string, file: File) {
    const existing = photos.value.find((p) => p.workId === workId);
    if (existing) removePhoto(existing.id);
    photos.value.push(makePhoto(file, workId));
  }
  function removePhoto(id: string) {
    const index = photos.value.findIndex((p) => p.id === id);
    if (index === -1) return;
    revoke(photos.value[index]);
    photos.value.splice(index, 1);
  }
  function photoForWork(workId: string): ReportPhoto | undefined {
    return photos.value.find((p) => p.workId === workId);
  }
  function removeWork(workId: string) {
    form.value.works = form.value.works.filter((w) => w.id !== workId);
    const photo = photoForWork(workId);
    if (photo) removePhoto(photo.id);
  }
  function clearPhotos() {
    revoke(panorama.value);
    panorama.value = null;
    photos.value.forEach(revoke);
    photos.value = [];
  }

  // ── snapshot / dirty ──────────────────────────────────────
  function snapshot(): string {
    const f = form.value;
    const workIndex = (id: string | null) => f.works.findIndex((w) => w.id === id);
    return JSON.stringify({
      startTime: f.startTime,
      endTime: f.endTime,
      weather: f.weather,
      works: f.works.map(({ name, location, unit, actual }) => ({ name, location, unit, actual })),
      crew: f.crew.map(({ name, type, count, hours }) => ({ name, type, count, hours })),
      machines: f.machines.map(({ name, size, quantity, hours }) => ({ name, size, quantity, hours })),
      accidentCount: f.accidentCount,
      issues: f.issues.map(({ text, status }) => ({ text, status })),
      panorama: panorama.value ? `${panorama.value.file.name}_${panorama.value.file.size}` : '',
      photos: photos.value.map((p) => `${p.file.name}_${p.file.size}_${workIndex(p.workId)}`),
    });
  }
  const isDirty = computed(() => snapshot() !== initialSnapshot.value);

  // ── load ──────────────────────────────────────────────────
  async function loadFromServer() {
    const [existing, prevCrew] = await Promise.all([
      store.fetchReportByRound(roundId),
      store.fetchPreviousCrew(roundId),
    ]);
    previousCrew.value = prevCrew;
    clearPhotos();

    if (existing) {
      isEditMode.value = true;
      isCarriedForward.value = false;
      const next = formFromReport(existing);
      form.value = next;
      for (const img of existing.images ?? []) {
        const fullUrl = img.imageUrl.startsWith('http') ? img.imageUrl : `${API_BASE_URL}${img.imageUrl}`;
        const file = await urlToFile(fullUrl, img.imageUrl.split('/').pop() || 'image.jpg');
        if (!file) continue;
        if (img.imageType === 'PANORAMA') {
          setPanorama(file);
        } else {
          const work = next.works.find((w) => w.name === img.caption);
          if (work && !photoForWork(work.id)) photos.value.push(makePhoto(file, work.id));
        }
      }
      return;
    }

    isEditMode.value = false;
    const next = emptyForm();
    // ช่วงเวลาทำงานมักเหมือนรอบก่อน — ใช้เป็นค่าเริ่มต้น
    const period = splitWorkingPeriod(prevCrew?.workingPeriod);
    if (period) {
      next.startTime = period.start;
      next.endTime = period.end;
    }
    const previousItems = await store.fetchPreviousWorkItems(roundId);
    next.works = worksFromPrevious(previousItems);
    isCarriedForward.value = next.works.length > 0;
    form.value = next;
  }

  function applyDraftPhotos(list: DraftPhoto[]) {
    for (const p of list) {
      const file = new File([p.blob], p.name, { type: p.type });
      if (p.isPanorama) setPanorama(file);
      else photos.value.push(makePhoto(file, p.workId, p.id));
    }
  }

  async function load() {
    isLoading.value = true;
    stopAutosave();
    try {
      await loadFromServer();
      initialSnapshot.value = snapshot();
      const draft = await loadDraft(roundId);
      if (draft) {
        clearPhotos();
        form.value = draft.form;
        applyDraftPhotos(draft.photos);
        step.value = Math.min(Math.max(draft.step, 0), STEP_KEYS.length - 1);
        restoredDraftAt.value = draft.savedAt;
        draftSavedAt.value = draft.savedAt;
      }
    } finally {
      isLoading.value = false;
      startAutosave();
    }
  }

  /** ทิ้งฉบับร่างแล้วโหลดข้อมูลจากเซิร์ฟเวอร์ใหม่ */
  async function discardDraft() {
    await clearDraft(roundId);
    restoredDraftAt.value = null;
    draftSavedAt.value = null;
    step.value = 0;
    await load();
  }

  // ── autosave ──────────────────────────────────────────────
  let timer: ReturnType<typeof setTimeout> | null = null;
  let stopWatch: (() => void) | null = null;

  async function persistDraft() {
    if (!isDirty.value) {
      await clearDraft(roundId);
      draftSavedAt.value = null;
      return;
    }
    const savedAt = Date.now();
    const draftPhotos: DraftPhoto[] = [
      ...(panorama.value
        ? [{ id: panorama.value.id, workId: null, isPanorama: true, name: panorama.value.file.name, type: panorama.value.file.type, blob: panorama.value.file }]
        : []),
      ...photos.value.map((p) => ({ id: p.id, workId: p.workId, isPanorama: false, name: p.file.name, type: p.file.type, blob: p.file })),
    ];
    const ok = await saveDraft({
      roundId,
      savedAt,
      step: step.value,
      // toRaw ไม่พอสำหรับ object ซ้อน — แปลงเป็น JSON ล้วนก่อนเก็บใน IndexedDB
      form: JSON.parse(JSON.stringify(form.value)) as ReportForm,
      photos: draftPhotos,
    });
    draftSaveFailed.value = !ok;
    if (ok) draftSavedAt.value = savedAt;
  }

  function scheduleSave() {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      void persistDraft();
    }, AUTOSAVE_DELAY_MS);
  }
  function startAutosave() {
    stopWatch = watch([form, panorama, photos, step], scheduleSave, { deep: true });
  }
  function stopAutosave() {
    stopWatch?.();
    stopWatch = null;
    if (timer) clearTimeout(timer);
    timer = null;
  }
  /** บันทึกร่างทันที (เช่น ก่อนออกจากหน้า) */
  async function flushDraft() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
      await persistDraft();
    }
  }

  // ── previous crew ─────────────────────────────────────────
  const previousCrewSummary = computed(() => {
    const prev = previousCrew.value;
    if (!prev) return null;
    const people = prev.personnels.reduce((sum, p) => sum + (Number(p.count) || 0), 0);
    return { people, roles: prev.personnels.length, machines: prev.machines.length };
  });
  function copyPreviousCrew() {
    if (previousCrew.value) applyPreviousCrew(form.value, previousCrew.value);
  }

  // ── validation / submit ───────────────────────────────────
  const problems = computed(() => validateReport(form.value, !!panorama.value));
  const blockingProblems = computed(() => problems.value.filter((p) => p.level === 'blocking'));

  async function submit(): Promise<SubmitResult> {
    if (blockingProblems.value.length > 0) return { ok: false, reason: 'invalid' };
    const payload = buildPayload(roundId, form.value);
    const formData = new FormData();
    formData.append('payload', JSON.stringify(payload));
    if (panorama.value) formData.append('panoramaFile', panorama.value.file);
    for (const work of form.value.works) {
      const photo = photoForWork(work.id);
      if (!photo) continue;
      formData.append('photos', photo.file);
      formData.append('photoWorkDetailNames', work.name);
    }
    await flushDraft();
    try {
      await store.submitReport(formData);
      stopAutosave();
      await clearDraft(roundId);
      draftSavedAt.value = null;
      return { ok: true };
    } catch (err) {
      const noResponse = !(err as { response?: unknown }).response;
      if (!isOnline.value || noResponse) return { ok: false, reason: 'offline' };
      return { ok: false, reason: 'server', message: store.submitError ?? undefined };
    }
  }

  onUnmounted(() => {
    void flushDraft();
    stopAutosave();
    window.removeEventListener('online', setOnline);
    window.removeEventListener('offline', setOffline);
    clearPhotos();
  });

  return {
    roundId,
    store,
    form,
    panorama,
    photos,
    step,
    isLoading,
    isEditMode,
    isCarriedForward,
    isOnline,
    isDirty,
    draftSavedAt,
    draftSaveFailed,
    restoredDraftAt,
    previousCrew,
    previousCrewSummary,
    problems,
    blockingProblems,
    load,
    discardDraft,
    flushDraft,
    setPanorama,
    removePanorama,
    setWorkPhoto,
    removePhoto,
    photoForWork,
    removeWork,
    copyPreviousCrew,
    submit,
  };
}

export type ConstructionReportContext = ReturnType<typeof createConstructionReport>;

const KEY: InjectionKey<ConstructionReportContext> = Symbol('constructionReport');

export function provideConstructionReport(roundId: number): ConstructionReportContext {
  const ctx = createConstructionReport(roundId);
  provide(KEY, ctx);
  return ctx;
}

export function useConstructionReport(): ConstructionReportContext {
  const ctx = inject(KEY);
  if (!ctx) throw new Error('useConstructionReport() must be used inside ConstructionInspectPage');
  return ctx;
}

