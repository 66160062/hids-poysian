import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { isAxiosError } from 'axios';
import type { Category, DefectSubCategory, RoomTemplate, SubCategory, Defect } from 'src/models.ts';
import { api, REQUEST_TIMEOUT_MS, UPLOAD_TIMEOUT_MS } from 'src/boot/axios';
import { t } from 'src/boot/i18n';
import { localizedText } from 'src/composables/useLocalizedField';

// ── Optimistic save/edit sync tracking ──────────────────────
// key: real defectId (edit) or a negative temp id (create, until fetchDefects pulls in the real row)

export type DefectSyncStatus = 'pending' | 'error';

export interface DefectSyncEntry {
  status: DefectSyncStatus;
  isCreate: boolean;
  roundId: string | number;
  error: string;
  previewDefect?: Defect; // create only — placeholder card data until the real defect exists in `defects`
}

// ── Types เพิ่มเติมสำหรับ filter/group ───────────────────────

export type GroupByMode = 'room_type' | 'floor' | 'severity';

export interface FilterState {
  groupBy: GroupByMode;
  floors: string[]; // floor label เช่น ['ชั้น 1', 'ชั้น 2']
  roomTypes: string[]; // roomType เช่น ['bedroom', 'bathroom']
  severityLevels: string[]; // severity เช่น ['Major', 'Minor']
}

// card ที่ใช้แสดงใน InspectionItemCard
export interface GroupedDefectItem {
  groupKey: string;
  roomName: string; // ชื่อที่แสดงบน card (ขึ้นกับ groupBy)
  roomId: number; // templateId ใช้ navigate ไปหน้า roomDefect
  floorLabel: string;
  roomType: string;
  severity: string;
  totalItems: number;
  passCount: number;
  failCount: number;
  passPercentage: number;
  failPercentage: number;
  defects: Defect[]; // raw defects ในกลุ่มนี้ (ส่งต่อไปหน้า detail)
  lastActivityAt: number; // เวลาแก้ไข/เพิ่ม defect ล่าสุดในกลุ่มนี้ (epoch ms) — ใช้เรียงตาม sortOrder
  firstActivityAt?: number | undefined; // เวลาที่ defect แรกในกลุ่มนี้ถูกสร้าง (epoch ms) — ใช้คำนวณลำดับที่เริ่มตรวจ
  orderIndex?: number | undefined; // ลำดับที่เริ่มตรวจ (1, 2, 3...)
}

// ── Helpers: ดึงค่าจาก nested Defect object ─────────────────

const getFloorLabel = (d: Defect) => d.floor?.label ?? t('common.unspecified.floor');

const getRoomName = (d: Defect) =>
  d.subRoom?.roomName ?? // ห้องย่อย (ละเอียดกว่า)
  d.room?.roomName ?? // fallback ประเภทห้อง
  t('common.unspecified.room');

const getRoomType = (d: Defect) => d.room?.roomName ?? t('common.unspecified.roomType');

// ค่าข้างบนใช้เป็น "key" (groupKey, ค่า filter) จึงคงเป็นชื่อไทยเสมอ ไม่เปลี่ยนตามภาษา —
// ถ้าเอาชื่ออังกฤษไปทำ key สลับภาษาตอนมี filter/เปิดหน้าห้องค้างอยู่แล้ว key จะไม่ตรงกัน
// ส่วน 3 ตัวนี้ใช้แสดงผลเท่านั้น: ชื่ออังกฤษถ้ามีและภาษาเป็นอังกฤษ ไม่งั้นใช้ชื่อไทย
const displayFloorLabel = (d: Defect) =>
  d.floor ? localizedText(d.floor.label, d.floor.labelEn) : t('common.unspecified.floor');

const displayRoomName = (d: Defect) =>
  d.subRoom
    ? localizedText(d.subRoom.roomName, d.subRoom.roomNameEn)
    : d.room
      ? localizedText(d.room.roomName, d.room.roomNameEn)
      : t('common.unspecified.room');

const displayRoomType = (d: Defect) =>
  d.room ? localizedText(d.room.roomName, d.room.roomNameEn) : t('common.unspecified.roomType');

// เวลาที่ defect ตัวนี้ถูกแก้ไข/เพิ่มล่าสุด — ใช้ updatedAt ก่อน (ครอบคลุมทั้งแก้ไขและเพิ่มใหม่) fallback เป็น createdAt
const getLastActivity = (d: Defect) => {
  const updated = d.updatedAt ? new Date(d.updatedAt).getTime() : 0;
  const created = d.createdAt ? new Date(d.createdAt).getTime() : 0;
  return Math.max(updated, created);
};

// เวลาที่ defect ตัวนี้ถูกสร้างครั้งแรก — ใช้ createdAt ก่อน fallback เป็น defectId หรือ updatedAt
const getFirstCreated = (d: Defect) => {
  const created = d.createdAt ? new Date(d.createdAt).getTime() : 0;
  if (created > 0) return created;
  if (typeof d.defectId === 'number' && d.defectId > 0) return d.defectId;
  return d.updatedAt ? new Date(d.updatedAt).getTime() : 0;
};

const SEVERITY_LABEL: Record<string, string> = {
  Major: 'Major',
  Minor: 'Minor',
};

// ── Cache ข้อมูลที่ใช้ซ้ำระหว่างเดินตรวจ ────────────────────────
// เดิมเปิดหน้าเพิ่ม defect ทีไรต้องรอ /rooms → /sub-rooms → /floor ทีละตัว + ดึงรอบตรวจซ้ำ 3 ครั้ง
// ข้อมูลพวกนี้แทบไม่เปลี่ยนระหว่างตรวจ จึงโหลดครั้งเดียวแล้วใช้ซ้ำทั้ง session

// isOther: ตัวเลือก "ชั้นอื่นๆ" ที่ต้องให้ผู้ตรวจพิมพ์ชื่อชั้นเอง
// order: floor_order จาก backend (ชั้นมาตรฐาน 10..110, ชั้นที่พิมพ์เอง/อื่นๆ = null) ใช้เรียงแปลนตามชั้นแบบตายตัว
export type SelectOption = { value: number; label: string; isOther?: boolean; order?: number | null };

type FloorRow = { floorId: number; label: string; labelEn?: string | null; floorOrder?: number | null };

// แถว "ชั้นอื่นๆ....." เป็น lookup ธรรมดาในตาราง floor (ไม่มีคอลัมน์บอกว่าเป็นตัวเลือกอื่นๆ) จึงดูจากชื่อ
export const isOtherFloor = (floor: Pick<FloorRow, 'label' | 'labelEn'>) =>
  /อื่น/.test(floor.label) || /other/i.test(floor.labelEn ?? '');

// ตัวเลือก "อื่นๆ" อยู่ท้ายสุดเสมอ ชั้นที่พิมพ์เพิ่มเองจะขึ้นก่อนหน้ามัน
const toFloorOptions = (rows: FloorRow[]): SelectOption[] => {
  const options = rows.map((f) => ({ value: f.floorId, label: f.label, isOther: isOtherFloor(f), order: f.floorOrder ?? null }));
  return [...options.filter((o) => !o.isOther), ...options.filter((o) => o.isOther)];
};

export interface RoundSummary {
  roundId: number;
  status?: string;
  job?: { jobId?: number };
}

// สถานะรอบอาจถูกเปลี่ยนจากอีกเครื่อง (เช่นแอดมินอนุมัติ) จึงเก็บไว้แค่ช่วงสั้นๆ
// ส่วนการเปลี่ยนจากเครื่องนี้ (submit/confirm/approve) ล้าง cache ทันทีผ่าน interceptor ด้านล่าง
const ROUND_CACHE_MS = 60_000;

const quick = { timeout: REQUEST_TIMEOUT_MS };

// ตำแหน่งล่าสุดที่บันทึก defect ในรอบนั้น ใช้เป็นค่าเริ่มต้นเวลาเปิดฟอร์มใหม่ ไม่ต้องเลือกห้อง/ชั้นซ้ำ
export interface LastDefectLocation {
  roomId: number;
  subRoomId: number | null;
  floorId: number;
  // เลือก "ชั้นอื่นๆ" แล้วพิมพ์ชื่อเอง: เก็บชื่อไว้เติมให้จุดถัดไป
  customFloorLabel: string | null;
  categoryId: number | null;
  planId: number | null;
}

// ── Store ─────────────────────────────────────────────────────

export const useInspectionStore = defineStore('inspection', () => {
  // ── state เดิม (ไม่แตะ) ────────────────────────────────────
  const rooms = ref<RoomTemplate[]>([]);
  const categories = ref<Category[]>([]);
  const subCategories = ref<SubCategory[]>([]);
  const isLoading = ref(false);

  // ── state ใหม่ ─────────────────────────────────────────────
  const defects = ref<Defect[]>([]);
  const isLoadingDefects = ref(false);
  const defectsError = ref<string | null>(null);
  const searchQuery = ref('');

  const filter = ref<FilterState>({
    groupBy: 'room_type',
    floors: [],
    roomTypes: [],
    severityLevels: [],
  });

  // เรียงกลุ่ม defect ตามลำดับการตรวจ: asc = ลำดับตรวจก่อน (1 ➔ 5), desc = ลำดับตรวจหลัง (5 ➔ 1)
  const sortOrder = ref<'desc' | 'asc'>('asc');

  const defectSyncState = ref<Record<number, DefectSyncEntry>>({});
  // ไม่ต้อง reactive เพราะเก็บ closure (FormData/File อยู่ข้างใน) ไว้ให้ retry เรียกซ้ำได้
  const syncTasks = new Map<number, () => Promise<unknown>>();

  // roundId ของ defects ที่อยู่ใน store ตอนนี้ ใช้ตัดสินว่าแสดง list เดิมก่อนแล้วค่อย refresh ได้ไหม
  const defectsRoundId = ref<string | null>(null);

  // master data สำหรับฟอร์ม defect (โหลดครั้งเดียว)
  const roomOptions = ref<SelectOption[]>([]);
  const subRoomOptions = ref<SelectOption[]>([]);
  const floorOptions = ref<SelectOption[]>([]);
  let masterDataPromise: Promise<void> | null = null;

  const roundCache = new Map<string, { at: number; promise: Promise<RoundSummary> }>();

  const lastLocationByRound = ref<Record<string, LastDefectLocation>>({});

  // ── computed เดิม (ไม่แตะ) ────────────────────────────────
  const allRooms = computed(() => rooms.value);
  const allCategories = computed(() => categories.value);

  const getSubByCategoryId = (selectedId: number) => {
    return subCategories.value.filter((sub: DefectSubCategory) => {
      return sub.category && Number(sub.category.categoryId) === Number(selectedId);
    });
  };

  // ── computed ใหม่: ตัวเลือกสำหรับ FilterBottomSheet ────────

  const availableFloors = computed(() => {
    const byKey = new Map<string, string>();
    for (const d of defects.value) {
      if (!byKey.has(getFloorLabel(d))) byKey.set(getFloorLabel(d), displayFloorLabel(d));
    }
    return [...byKey.entries()]
      .sort(([a], [b]) => a.localeCompare(b, 'th'))
      .map(([value, label]) => ({ value, label }));
  });

  const availableRoomTypes = computed(() => {
    const byKey = new Map<string, string>();
    for (const d of defects.value) {
      if (!byKey.has(getRoomType(d))) byKey.set(getRoomType(d), displayRoomType(d));
    }
    return [...byKey.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([value, label]) => ({ value, label }));
  });

  const availableSeverityLevels = computed(() => {
    const order = ['low', 'medium', 'high', 'critical'];
    const levels = [...new Set(defects.value.map((d) => d.severity))];
    return levels
      .sort((a, b) => order.indexOf(a) - order.indexOf(b))
      .map((v) => ({ value: v, label: SEVERITY_LABEL[v] ?? v }));
  });

  // ── computed ใหม่: defects หลัง search + filter ────────────

  const filteredDefects = computed(() => {
    let list = defects.value;

    // search
    const q = searchQuery.value.trim().toLowerCase();
    if (q) {
      list = list.filter((d) => {
        return (
          getRoomName(d).toLowerCase().includes(q) ||
          getRoomType(d).toLowerCase().includes(q) ||
          getFloorLabel(d).toLowerCase().includes(q) ||
          displayRoomName(d).toLowerCase().includes(q) ||
          displayRoomType(d).toLowerCase().includes(q) ||
          displayFloorLabel(d).toLowerCase().includes(q)
        );
      });
    }

    if (filter.value.floors.length > 0) {
      list = list.filter((d) => filter.value.floors.includes(getFloorLabel(d)));
    }
    if (filter.value.roomTypes.length > 0) {
      list = list.filter((d) => filter.value.roomTypes.includes(getRoomType(d)));
    }
    if (filter.value.severityLevels.length > 0) {
      list = list.filter((d) => filter.value.severityLevels.includes(d.severity));
    }

    return list;
  });

  // ── computed ใหม่: group ตาม groupBy ──────────────────────

  const groupedDefects = computed<GroupedDefectItem[]>(() => {
    const map = new Map<string, GroupedDefectItem>();

    // คำนวณ firstActivityAt ของแต่ละกลุ่มจาก defects ทั้งหมดของรอบ เพื่อให้เลขลำดับห้องคงที่เสมอ
    const globalFirstActivityMap = new Map<string, number>();
    for (const defect of defects.value) {
      const key = buildGroupKey(defect);
      const created = getFirstCreated(defect);
      const existing = globalFirstActivityMap.get(key) ?? Infinity;
      globalFirstActivityMap.set(key, Math.min(existing, created));
    }
    const globalOrderMap = new Map<string, number>();
    [...globalFirstActivityMap.entries()]
      .sort(([, a], [, b]) => a - b)
      .forEach(([key], idx) => {
        globalOrderMap.set(key, idx + 1);
      });

    for (const defect of filteredDefects.value) {
      const key = buildGroupKey(defect);
      const firstCreated = getFirstCreated(defect);

      if (!map.has(key)) {
        map.set(key, {
          groupKey: key,
          roomName: buildGroupLabel(defect),
          roomId: defect.room?.roomId ?? defect.defectId,
          floorLabel: displayFloorLabel(defect),
          roomType: displayRoomType(defect),
          severity: defect.severity,
          totalItems: 0,
          passCount: 0,
          failCount: 0,
          passPercentage: 0,
          failPercentage: 0,
          defects: [],
          lastActivityAt: 0,
          firstActivityAt: firstCreated,
          orderIndex: globalOrderMap.get(key),
        });
      }

      const group = map.get(key)!;
      group.totalItems++;
      group.defects.push(defect);
      group.lastActivityAt = Math.max(group.lastActivityAt, getLastActivity(defect));
      group.firstActivityAt = Math.min(group.firstActivityAt ?? Infinity, firstCreated);
      if (defect.status === 'verified') group.passCount++;
      else group.failCount++;
    }

    for (const g of map.values()) {
      g.passPercentage = g.totalItems > 0 ? Math.round((g.passCount / g.totalItems) * 100) : 0;
      g.failPercentage = 100 - g.passPercentage;
    }

    const groups = [...map.values()];
    groups.sort((a, b) => {
      const orderA = a.orderIndex ?? Infinity;
      const orderB = b.orderIndex ?? Infinity;
      if (orderA !== orderB) {
        return sortOrder.value === 'desc' ? orderB - orderA : orderA - orderB;
      }
      return sortOrder.value === 'desc'
        ? b.lastActivityAt - a.lastActivityAt
        : a.lastActivityAt - b.lastActivityAt;
    });

    return groups;
  });

  // ── computed ใหม่: summary card ────────────────────────────

  const summaryData = computed(() => {
    const list = filteredDefects.value;
    const pass = list.filter((d) => d.status === 'verified').length;
    return {
      totalRooms: new Set(list.map((d) => d.room?.roomId)).size, // ✅ เปลี่ยนจาก templateId เป็น roomId
      totalJobs: new Set(
        list.flatMap((d) => d.subCategories.map((s) => s.category?.categoryId)).filter(Boolean),
      ).size,
      totalItems: list.length,
      pass,
      fail: list.length - pass,
    };
  });

  // ── computed ใหม่: badge จำนวน filter ที่ active ──────────

  const activeFilterCount = computed(() => {
    let n = 0;
    if (filter.value.floors.length > 0) n++;
    if (filter.value.roomTypes.length > 0) n++;
    if (filter.value.severityLevels.length > 0) n++;
    return n;
  });

  // ── helpers (ใช้ใน computed) ───────────────────────────────

  function buildGroupKey(d: Defect): string {
    switch (filter.value.groupBy) {
      case 'floor':
        return `floor__${getFloorLabel(d)}`;
      case 'severity':
        return `severity__${d.severity}`;
      default:
        return `room__${getRoomName(d)}__${getFloorLabel(d)}`;
    }
  }

  function buildGroupLabel(d: Defect): string {
    switch (filter.value.groupBy) {
      case 'floor':
        return displayFloorLabel(d);
      case 'severity':
        return SEVERITY_LABEL[d.severity] ?? d.severity;
      default:
        return displayRoomName(d);
    }
  }

  // ── actions เดิม (ไม่แตะ) ─────────────────────────────────

  // โหลดหมวด/หมวดย่อย/ห้อง/ห้องย่อย/ชั้นพร้อมกันครั้งเดียวต่อ session
  // เรียกซ้ำระหว่างโหลดอยู่จะได้ promise เดิม ถ้าพลาดจะลองใหม่ได้ในครั้งถัดไป
  function ensureMasterData(): Promise<void> {
    if (masterDataPromise) return masterDataPromise;
    isLoading.value = true;
    masterDataPromise = Promise.all([
      api.get('/defect-categories', quick),
      api.get('/defect-sub-categories', quick),
      api.get<{ roomId: number; roomName: string }[]>('/rooms', quick),
      api.get<{ subRoomId: number; roomName: string }[]>('/sub-rooms', quick),
      api.get<FloorRow[]>('/floor', quick),
    ])
      .then(([catRes, subRes, roomRes, subRoomRes, floorRes]) => {
        categories.value = catRes.data;
        subCategories.value = subRes.data;
        roomOptions.value = roomRes.data.map((r) => ({ value: r.roomId, label: r.roomName }));
        subRoomOptions.value = subRoomRes.data.map((s) => ({ value: s.subRoomId, label: s.roomName }));
        floorOptions.value = toFloorOptions(floorRes.data);
      })
      .catch((err) => {
        masterDataPromise = null;
        console.error('Fetch Master Data Error:', err);
        throw err;
      })
      .finally(() => {
        isLoading.value = false;
      });
    return masterDataPromise;
  }

  // ข้อมูลรอบตรวจ (สถานะล็อก + jobId) ใช้ร่วมกันทุกหน้าในรอบเดียวกัน ยิงจริงครั้งเดียวต่อช่วง cache
  function getRound(roundId: string | number, { fresh = false } = {}): Promise<RoundSummary> {
    const key = String(roundId);
    const cached = roundCache.get(key);
    if (!fresh && cached && Date.now() - cached.at < ROUND_CACHE_MS) return cached.promise;
    const promise = api.get<RoundSummary>(`/inspection-rounds/${key}`, quick).then((res) => res.data);
    roundCache.set(key, { at: Date.now(), promise });
    promise.catch(() => roundCache.delete(key));
    return promise;
  }

  function invalidateRound(roundId: string | number) {
    roundCache.delete(String(roundId));
  }

  // เปลี่ยนสถานะรอบจากเครื่องนี้ (submit/confirm/approve ฯลฯ) ต้องไม่เห็นสถานะเก่าจาก cache
  api.interceptors.response.use((response) => {
    const method = response.config.method?.toLowerCase();
    const match = /\/inspection-rounds\/(\d+)/.exec(response.config.url ?? '');
    if (method && method !== 'get' && match?.[1]) invalidateRound(match[1]);
    return response;
  });

  function rememberLocation(roundId: string | number, location: LastDefectLocation) {
    lastLocationByRound.value[String(roundId)] = location;
  }

  function lastLocation(roundId: string | number): LastDefectLocation | undefined {
    return lastLocationByRound.value[String(roundId)];
  }

  // ของเดิมยังมีคนเรียกได้ ให้ชี้ไปใช้ cache ตัวใหม่แทนการยิงซ้ำ
  async function fetchInspectionMasterData() {
    try {
      await ensureMasterData();
    } catch {
      // logged in ensureMasterData
    }
  }

  async function saveDefect(payload: FormData) {
    try {
      const res = await api.post<Defect>('/defects', payload, { timeout: UPLOAD_TIMEOUT_MS });
      return res.data;
    } catch (err) {
      const error = err as { response?: { data: unknown } };
      console.error('Save Defect Error:', error.response?.data);
      throw err;
    }
  }

  async function updateDefect(id: number, payload: FormData) {
    try {
      const res = await api.patch(`/defects/${id}`, payload, { timeout: UPLOAD_TIMEOUT_MS });
      return res.data;
    } catch (err) {
      const error = err as { response?: { data: unknown } };
      console.error('Update Defect Error:', error.response?.data);
      throw err;
    }
  }

  async function deleteDefect(id: number) {
    try {
      const res = await api.delete(`/defects/${id}`);
      return res.data;
    } catch (err) {
      const error = err as { response?: { data: unknown } };
      console.error('Delete Defect Error:', error.response?.data);
      throw err;
    }
  }

  function clearData() {
    rooms.value = [];
    categories.value = [];
    subCategories.value = [];
  }

  // ── Optimistic save/edit sync ─────────────────────────────

  function extractErrorMessage(err: unknown, fallback: string): string {
    if (isAxiosError(err) && err.response?.status === 409) {
      return (
        (err.response.data as { message?: string } | undefined)?.message ??
        t('inspection.addDefect.duplicateDefect')
      );
    }
    return fallback;
  }

  // backend ตอบ defect ที่สร้างในรูปร่างเดียวกับ list (GET /defects/round/:id) ใส่ลง store ได้เลย
  // ไม่ต้องดึงทั้งรอบใหม่ทุกครั้งที่บันทึก (เดิม refetch ทั้ง list หลังสร้างแต่ละตัว)
  // ชั้นที่ backend เพิ่งสร้างจากชื่อที่ผู้ตรวจพิมพ์ ให้ขึ้นในรายการชั้นทันที (ก่อนตัวเลือก "อื่นๆ")
  function upsertFloorOption(floor: Defect['floor']) {
    if (!floor || floorOptions.value.some((o) => o.value === floor.floorId)) return;
    floorOptions.value = toFloorOptions([
      ...floorOptions.value.map((o) => ({ floorId: o.value, label: o.label, labelEn: o.isOther ? 'Other' : null, floorOrder: o.order ?? null })),
      { floorId: floor.floorId, label: floor.label, labelEn: floor.labelEn ?? null },
    ]);
  }

  function upsertDefect(roundId: string | number, defect: Defect) {
    upsertFloorOption(defect.floor);
    if (defectsRoundId.value !== String(roundId)) return;
    const idx = defects.value.findIndex((d) => d.defectId === defect.defectId);
    if (idx === -1) defects.value.push(defect);
    else defects.value[idx] = defect;
  }

  const isDefect = (value: unknown): value is Defect =>
    typeof value === 'object' && value !== null && typeof (value as Defect).defectId === 'number';

  async function runDefectSync(
    id: number,
    isCreate: boolean,
    roundId: string | number,
    task: () => Promise<unknown>,
    previewDefect?: Defect,
  ) {
    syncTasks.set(id, task);
    defectSyncState.value[id] = {
      status: 'pending',
      isCreate,
      roundId,
      error: '',
      ...(previewDefect ? { previewDefect } : {}),
    };
    try {
      const result = await task();
      if (isCreate) {
        if (isDefect(result)) upsertDefect(roundId, result);
        else await fetchDefects(roundId, { background: true });
      }
      delete defectSyncState.value[id];
      syncTasks.delete(id);
    } catch (err) {
      const existing = defectSyncState.value[id];
      defectSyncState.value[id] = {
        status: 'error',
        isCreate,
        roundId,
        error: extractErrorMessage(err, t('inspection.addDefect.saveError')),
        ...(existing?.previewDefect ? { previewDefect: existing.previewDefect } : {}),
      };
    }
  }

  function retryDefectSync(id: number) {
    const entry = defectSyncState.value[id];
    const task = syncTasks.get(id);
    if (!entry || !task || entry.status === 'pending') return;
    void runDefectSync(id, entry.isCreate, entry.roundId, task, entry.previewDefect);
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
      for (const key of Object.keys(defectSyncState.value)) {
        const id = Number(key);
        if (defectSyncState.value[id]?.status === 'error') retryDefectSync(id);
      }
    });
  }

  // ── actions ใหม่ ───────────────────────────────────────────

  // background: refresh เงียบๆ โดยไม่โชว์ skeleton/error ทับ list ที่แสดงอยู่แล้ว
  async function fetchDefects(roundId: string | number, { background = false } = {}) {
    const key = String(roundId);
    if (!background) {
      isLoadingDefects.value = true;
      defectsError.value = null;
    }
    try {
      const { data } = await api.get<Defect[]>(`/defects/round/${key}`, quick);
      defects.value = data;
      defectsRoundId.value = key;
    } catch (err) {
      if (!background) defectsError.value = t('stores.inspection.fetchDefectsError');
      console.error('Fetch Defects Error:', err);
    } finally {
      if (!background) isLoadingDefects.value = false;
    }
  }

  // แสดง list ที่มีอยู่ของรอบนี้ทันทีแล้ว refresh เบื้องหลัง (stale-while-revalidate)
  // ครั้งแรกของรอบ (ยังไม่มีข้อมูล) ถึงจะรอโหลดจริง
  function hasDefectsFor(roundId: string | number) {
    return defectsRoundId.value === String(roundId);
  }

  function applyFilter(newFilter: FilterState) {
    filter.value = { ...newFilter };
  }

  function resetFilter() {
    filter.value = { groupBy: 'room_type', floors: [], roomTypes: [], severityLevels: [] };
  }

  // ── expose ─────────────────────────────────────────────────

  return {
    // เดิม
    rooms,
    categories,
    subCategories,
    isLoading,
    allRooms,
    allCategories,
    getSubByCategoryId,
    fetchInspectionMasterData,
    ensureMasterData,
    roomOptions,
    subRoomOptions,
    floorOptions,
    getRound,
    invalidateRound,
    rememberLocation,
    lastLocation,
    hasDefectsFor,
    groupKeyOf: buildGroupKey,
    saveDefect,
    updateDefect,
    deleteDefect,
    clearData,
    // ใหม่
    defects,
    isLoadingDefects,
    defectsError,
    searchQuery,
    filter,
    sortOrder,
    groupedDefects,
    summaryData,
    activeFilterCount,
    availableFloors,
    availableRoomTypes,
    availableSeverityLevels,
    fetchDefects,
    applyFilter,
    resetFilter,
    defectSyncState,
    runDefectSync,
    retryDefectSync,
  };
});
