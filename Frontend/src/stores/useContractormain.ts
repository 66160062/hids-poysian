import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { useRouter } from 'vue-router';
import { api } from 'src/boot/axios';

const API_BASE_URL = import.meta.env.VITE_API_URL as string;

export interface RepairRoom {
  id: number;
  name: string;
  tags: string[];
  floor: string;
  count: number;
  passed: number;
  failed: number;
}

export interface DefectItem {
  id: number;
  roomId: number;
  image: string;
  location: string;
  jobType: string;
  status: string;
  tags: string[];
  afterImage?: string;
  repairNote?: string;
}

export interface RepairStats {
  totalRoomTypes: number;
  totalJobTypes: number;
  totalItems: number;
  passed: number;
  failed: number;
}

export interface UpdateRepairPayload {
  status: string;
  afterImage: string;
  note: string;
}

interface DefectSubCategoryResponse {
  subCategoryId: number;
  name: string;
  category?: { categoryId: number; name: string };
}

interface DefectResponse {
  defectId: number;
  imageUrl?: string;
  status: string;
  room?: { roomId: number; roomName: string };
  subRoom?: { subRoomId: number; roomName: string } | null;
  floor?: { floorId: number; label: string };
  subCategories?: DefectSubCategoryResponse[];
}

interface RoundResponse {
  roundId: number;
}

export const useContractorRepair = defineStore('contractorRepair', () => {
  const router = useRouter();
  const search = ref('');
  const loading = ref(false);
  const error = ref<string | null>(null);

  const stats = ref<RepairStats>({
    totalRoomTypes: 0,
    totalJobTypes: 0,
    totalItems: 0,
    passed: 0,
    failed: 0,
  });

  const rooms = ref<RepairRoom[]>([]);
  const allDefectItems = ref<DefectItem[]>([]);

  // ── API INTEGRATION ──────────────────────────────────────────────────────
  const fetchRepairData = async (jobId: number) => {
    loading.value = true;
    error.value = null;
    try {
      const { data: roundsData } = await api.get<RoundResponse[]>(`/daily-reports/${jobId}/rounds`);
      const defectLists = await Promise.all(
        roundsData.map((round) =>
          api.get<DefectResponse[]>(`/defects/round/${round.roundId}`).then((res) => res.data),
        ),
      );
      const defects = defectLists.flat();

      const roomMap = new Map<string, RepairRoom>();
      const items: DefectItem[] = [];
      const roomTypeNames = new Set<string>();
      const jobTypeNames = new Set<string>();
      let nextRoomId = 1;

      for (const defect of defects) {
        const roomName = defect.room?.roomName || '-';
        const subRoomName = defect.subRoom?.roomName || '-';
        const floorLabel = defect.floor?.label ? `ชั้น ${defect.floor.label}` : '-';
        const key = `${defect.room?.roomId ?? 0}-${defect.subRoom?.subRoomId ?? 0}-${defect.floor?.floorId ?? 0}`;

        let room = roomMap.get(key);
        if (!room) {
          room = {
            id: nextRoomId++,
            name: `${roomName}, ${subRoomName}, ${floorLabel}`,
            tags: [roomName],
            floor: floorLabel,
            count: 0,
            passed: 0,
            failed: 0,
          };
          roomMap.set(key, room);
        }

        const isPassed = defect.status === 'PASS';
        room.count++;
        if (isPassed) room.passed++;
        else room.failed++;

        roomTypeNames.add(roomName);

        const categoryNames = Array.from(
          new Set(
            (defect.subCategories ?? [])
              .map((sub) => sub.category?.name)
              .filter((name): name is string => !!name),
          ),
        );
        categoryNames.forEach((name) => jobTypeNames.add(name));

        items.push({
          id: defect.defectId,
          roomId: room.id,
          image: defect.imageUrl
            ? defect.imageUrl.startsWith('http')
              ? defect.imageUrl
              : `${API_BASE_URL}${defect.imageUrl}`
            : '',
          location: room.name,
          jobType: categoryNames.join(', ') || '-',
          status: isPassed ? 'ผ่าน' : 'ไม่ผ่าน',
          tags: (defect.subCategories ?? []).map((sub) => sub.name),
        });
      }

      rooms.value = Array.from(roomMap.values());
      allDefectItems.value = items;

      const passed = items.filter((item) => item.status === 'ผ่าน').length;
      stats.value = {
        totalRoomTypes: roomTypeNames.size,
        totalJobTypes: jobTypeNames.size,
        totalItems: items.length,
        passed,
        failed: items.length - passed,
      };
    } catch (e) {
      error.value = 'โหลดข้อมูลไม่สำเร็จ';
      console.error(e);
    } finally {
      loading.value = false;
    }
  };

  // ── Update status (local state เท่านั้น — ไม่ได้อยู่ในสโคปนี้) ───────────
  const updateDefectStatus = (defectId: number, payload: UpdateRepairPayload) => {
    const item = allDefectItems.value.find((d) => d.id === defectId);
    if (item) {
      item.status = payload.status;
      item.afterImage = payload.afterImage;
      item.repairNote = payload.note;
    }
  };

  // ── Computed & Helpers ────────────────────────────────
  const getDefectsByRoom = (roomId: number) =>
    allDefectItems.value.filter((d) => d.roomId === roomId);

  const filteredRooms = computed(() =>
    rooms.value.filter((r) => r.name.toLowerCase().includes(search.value.toLowerCase())),
  );

  const tagColor = (tag: string): string => {
    const map: Record<string, string> = {
      ห้องนอน: 'blue',
      ห้องน้ำ: 'teal',
      ห้องครัว: 'orange',
      ห้องนั่งเล่น: 'purple',
      ห้องเก็บของ: 'brown',
      ระเบียง: 'cyan',
      ห้องพระ: 'deep-orange',
    };
    return map[tag] ?? 'grey';
  };

  const goToDefectList = (room: RepairRoom) => {
    void router.push(`/contractor/defect-list/${room.id}`);
  };

  const goToAllDefects = () => {
    void router.push('/contractor/defect-list');
  };

  return {
    search,
    loading,
    error,
    stats,
    rooms,
    filteredRooms,
    tagColor,
    allDefectItems,
    fetchRepairData,
    getDefectsByRoom,
    updateDefectStatus,
    goToDefectList,
    goToAllDefects,
  };
});
