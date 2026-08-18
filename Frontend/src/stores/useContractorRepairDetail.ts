import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import imageCompression from 'browser-image-compression';
import { useContractorRepair } from 'src/stores/useContractormain';
import { useLinkAccess } from 'src/stores/useLinkAccess';
import { api } from 'src/boot/axios';

const API_BASE_URL = import.meta.env.VITE_API_URL as string;

export interface RepairDetail {
  code: string;
  reportedAt: string;
  beforeImage: string;
  jobType: string;
  location: string;
  tags: string[];
  status: string;
}

interface DefectSubCategoryResponse {
  subCategoryId: number;
  name: string;
  category?: { categoryId: number; name: string };
}

interface DefectDetailResponse {
  defectId: number;
  createdAt: string;
  imageUrl?: string;
  contractorImageUrl?: string;
  contractorNote?: string;
  status: string;
  room?: { roomId: number; roomName: string };
  subRoom?: { subRoomId: number; roomName: string } | null;
  floor?: { floorId: number; label: string };
  subCategories?: DefectSubCategoryResponse[];
}

const resolveUrl = (url?: string) =>
  url ? (url.startsWith('http') ? url : `${API_BASE_URL}${url}`) : '';

// บีบอัดรูป + แปลงเป็น webp ก่อนส่งขึ้น backend เพื่อลด bandwidth ตอนอัปโหลด
// และให้ตรงเงื่อนไข passthrough ของ backend (storage.service.ts) จะได้ข้ามการ re-encode ซ้ำด้วย sharp
// ถ้าบีบอัดพลาด (เช่น browser ไม่รองรับ) ให้ fallback ใช้ไฟล์ต้นฉบับแทน ไม่บล็อกการอัปโหลด
const compressRepairImage = async (file: File): Promise<File> => {
  try {
    return await imageCompression(file, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: 'image/webp',
    });
  } catch (error) {
    console.error('Image compression failed, uploading original file:', error);
    return file;
  }
};

export function useRepairDetail(defectId: number) {
  const router = useRouter();
  const store = useContractorRepair();
  const linkStore = useLinkAccess();
  const { allDefectItems, contractorId } = storeToRefs(store);

  const found = allDefectItems.value.find((d) => d.id === defectId);

  const defect = ref<RepairDetail>({
    code: `DEF-${String(defectId).padStart(4, '0')}`,
    reportedAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
    beforeImage: found?.image ?? 'https://placehold.co/600x400/e0e0e0/999?text=Before',
    jobType: found?.jobType ?? '-',
    location: found?.location ?? '-',
    tags: found?.tags ?? [],
    status: found?.status ?? '-',
  });

  const afterImageUrl = ref('');
  const afterImageFile = ref<File | null>(null);
  const note = ref('');

  // เริ่มบีบอัดทันทีตอนเลือกรูปเสร็จ (background) แทนตอนกด save
  // เพื่อให้ compress ทำงานคู่ขนานไปกับตอน user กรอก note กด save แล้วแทบไม่ต้องรอ
  // เช็ค afterImageFile.value === file ก่อน apply กันกรณี user เปลี่ยน/ลบรูปใหม่ระหว่าง compress เก่ายังไม่เสร็จ
  let pendingImageCompression: Promise<void> | null = null;
  const setAfterImage = (file: File) => {
    afterImageFile.value = file;
    pendingImageCompression = compressRepairImage(file).then((compressed) => {
      if (afterImageFile.value === file) {
        afterImageFile.value = compressed;
      }
    });
  };
  const showSuccess = ref(false);
  const isSubmitting = ref(false);
  const submitError = ref<string | null>(null);
  const savedAfterImage = ref(found?.afterImage ?? '');
  const savedNote = ref(found?.repairNote ?? '');

  // เข้าหน้านี้ตรง ๆ (เช่น จากรายการ defect ฝั่งลูกค้า) โดยที่ store ของ contractor ยังไม่มีข้อมูล — ดึงเองจาก API
  if (!found) {
    void (async () => {
      try {
        const { data } = await api.get<DefectDetailResponse>(`/defects/${defectId}`, {
          params: linkStore.linkToken.value ? { token: linkStore.linkToken.value } : {},
        });

        const roomName = data.room?.roomName || '-';
        const subRoomName = data.subRoom?.roomName || '-';
        const floorLabel = data.floor?.label ? `ชั้น ${data.floor.label}` : '-';
        const categoryNames = Array.from(
          new Set(
            (data.subCategories ?? [])
              .map((sub) => sub.category?.name)
              .filter((name): name is string => !!name),
          ),
        );

        defect.value = {
          code: `DEF-${String(defectId).padStart(4, '0')}`,
          reportedAt: new Date(data.createdAt).toLocaleTimeString('th-TH', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          beforeImage: resolveUrl(data.imageUrl) || 'https://placehold.co/600x400/e0e0e0/999?text=Before',
          jobType: categoryNames.join(', ') || '-',
          location: `${roomName}, ${subRoomName}, ${floorLabel}`,
          tags: (data.subCategories ?? []).map((sub) => sub.name),
          status: data.status,
        };
        savedAfterImage.value = resolveUrl(data.contractorImageUrl);
        savedNote.value = data.contractorNote || '';
      } catch (e) {
        console.error(e);
      }
    })();
  }

  const submitRepair = async () => {
    if (!afterImageFile.value) return;
    if (!contractorId.value) {
      submitError.value = 'ไม่พบข้อมูลผู้รับเหมาสำหรับงานนี้';
      return;
    }

    isSubmitting.value = true;
    submitError.value = null;
    try {
      if (pendingImageCompression) await pendingImageCompression;
      if (!afterImageFile.value) {
        submitError.value = 'กรุณาเลือกรูปภาพ';
        return;
      }

      const formData = new FormData();
      formData.append('defectId', String(defectId));
      formData.append('contractorId', String(contractorId.value));
      if (note.value) formData.append('note', note.value);
      formData.append('file', afterImageFile.value);

      await api.put('/defects/contractor-update', formData, {
        params: {
          token: linkStore.linkToken.value || ''
        }
      });

      savedAfterImage.value = afterImageUrl.value;
      savedNote.value = note.value;
      store.updateDefectStatus(defectId, {
        status: 'repaired',
        afterImage: savedAfterImage.value,
        note: savedNote.value,
      });
      defect.value.status = 'repaired';
      showSuccess.value = true;
    } catch (e) {
      submitError.value = 'บันทึกไม่สำเร็จ กรุณาลองใหม่';
      console.error(e);
    } finally {
      isSubmitting.value = false;
    }
  };

  const confirmSuccess = () => {
    showSuccess.value = false;
    void router.back();
  };

  return {
    defect,
    afterImageUrl,
    afterImageFile,
    setAfterImage,
    note,
    submitRepair,
    isSubmitting,
    submitError,
    showSuccess,
    confirmSuccess,
    savedAfterImage,
    savedNote,
  };
}
