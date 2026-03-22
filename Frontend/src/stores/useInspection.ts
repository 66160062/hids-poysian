import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Category, DefectSubCategory, RoomTemplate, SubCategory, Defect } from 'src/models.ts';
import { api } from 'src/boot/axios';

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
}

// ── Helpers: ดึงค่าจาก nested Defect object ─────────────────

const getFloorLabel = (d: Defect) => d.template?.floor?.label ?? 'ไม่ระบุชั้น';

const getRoomName = (d: Defect) =>
  d.template?.subRoom?.roomName ?? // ห้องย่อย (ละเอียดกว่า)
  d.template?.room?.roomName ?? // fallback ประเภทห้อง
  'ไม่ระบุห้อง';

const getRoomType = (d: Defect) => d.template?.room?.roomName ?? 'ไม่ระบุประเภท';

const SEVERITY_LABEL: Record<string, string> = {
  Major: 'Major',
  Minor: 'Minor',
};

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
    const labels = [...new Set(defects.value.map(getFloorLabel))];
    return labels
      .sort((a, b) => a.localeCompare(b, 'th'))
      .map((label) => ({ value: label, label }));
  });

  const availableRoomTypes = computed(() => {
    return [...new Set(defects.value.map(getRoomType))].sort();
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
          getFloorLabel(d).toLowerCase().includes(q)
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

    for (const defect of filteredDefects.value) {
      const key = buildGroupKey(defect);

      if (!map.has(key)) {
        map.set(key, {
          groupKey: key,
          roomName: buildGroupLabel(defect),
          roomId: defect.template?.room?.roomId ?? defect.defectId,
          floorLabel: getFloorLabel(defect),
          roomType: getRoomType(defect),
          severity: defect.severity,
          totalItems: 0,
          passCount: 0,
          failCount: 0,
          passPercentage: 0,
          failPercentage: 0,
          defects: [],
        });
      }

      const group = map.get(key)!;
      group.totalItems++;
      group.defects.push(defect);
      if (defect.status === 'PASS') group.passCount++;
      else group.failCount++;
    }

    for (const g of map.values()) {
      g.passPercentage = g.totalItems > 0 ? Math.round((g.passCount / g.totalItems) * 100) : 0;
      g.failPercentage = 100 - g.passPercentage;
    }

    return [...map.values()];
  });

  // ── computed ใหม่: summary card ────────────────────────────

  const summaryData = computed(() => {
    const list = filteredDefects.value;
    const pass = list.filter((d) => d.status === 'PASS').length;
    return {
      // ประเภทห้องทั้งหมด = unique room (ไม่ใช่ unique roomName)
      totalRooms: new Set(list.map((d) => d.template?.room?.roomId)).size,

      // ประเภทงานทั้งหมด = unique defect_category
      totalJobs: new Set(
        list.flatMap((d) => d.subCategories.map((s) => s.category?.categoryId)).filter(Boolean),
      ).size,

      // รายการทั้งหมด = จำนวน defect
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
        return getFloorLabel(d);
      case 'severity':
        return SEVERITY_LABEL[d.severity] ?? d.severity;
      default:
        return getRoomName(d);
    }
  }

  // ── actions เดิม (ไม่แตะ) ─────────────────────────────────

  async function fetchInspectionMasterData(roundId: string | number) {
    isLoading.value = true;
    try {
      const [catRes, subRes] = await Promise.all([
        api.get('/defect-categories'),
        api.get('/defect-sub-categories'),
        api.get(`/inspection-rounds/${roundId}`),
      ]);
      categories.value = catRes.data;
      subCategories.value = subRes.data;
    } catch (err) {
      console.error('Fetch Master Data Error:', err);
    } finally {
      isLoading.value = false;
    }
  }

  async function saveDefect(payload: FormData) {
    try {
      const res = await api.post('/defects', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    } catch (err) {
      const error = err as { response?: { data: unknown } };
      console.error('Save Defect Error:', error.response?.data);
      throw err;
    }
  }

  function clearData() {
    rooms.value = [];
    categories.value = [];
    subCategories.value = [];
  }

  // ── actions ใหม่ ───────────────────────────────────────────

  async function fetchDefects(roundId: string | number) {
    isLoadingDefects.value = true;
    defectsError.value = null;
    try {
      const { data } = await api.get<Defect[]>(`/defects/round/${roundId}`);
      defects.value = data;
    } catch (err) {
      defectsError.value = 'โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';
      console.error('Fetch Defects Error:', err);
    } finally {
      isLoadingDefects.value = false;
    }
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
    saveDefect,
    clearData,
    // ใหม่
    defects,
    isLoadingDefects,
    defectsError,
    searchQuery,
    filter,
    groupedDefects,
    summaryData,
    activeFilterCount,
    availableFloors,
    availableRoomTypes,
    availableSeverityLevels,
    fetchDefects,
    applyFilter,
    resetFilter,
  };
});
