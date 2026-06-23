import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useContractorRepair } from 'src/stores/useContractormain';
import { api } from 'src/boot/axios';

export interface RepairDetail {
  code: string;
  reportedAt: string;
  beforeImage: string;
  jobType: string;
  location: string;
  tags: string[];
  status: string;
}

export function useRepairDetail(defectId: number) {
  const router = useRouter();
  const store = useContractorRepair();
  const { allDefectItems, contractorId } = storeToRefs(store);

  const found = allDefectItems.value.find((d) => d.id === defectId);

  const defect = ref<RepairDetail>({
    code: found ? `DEF-${String(found.id).padStart(4, '0')}` : 'DEF-0000',
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
  const showSuccess = ref(false);
  const isSubmitting = ref(false);
  const submitError = ref<string | null>(null);
  const savedAfterImage = ref(found?.afterImage ?? '');
  const savedNote = ref(found?.repairNote ?? '');

  const submitRepair = async () => {
    if (!afterImageFile.value) return;
    if (!contractorId.value) {
      submitError.value = 'ไม่พบข้อมูลผู้รับเหมาสำหรับงานนี้';
      return;
    }

    isSubmitting.value = true;
    submitError.value = null;
    try {
      const formData = new FormData();
      formData.append('defectId', String(defectId));
      formData.append('contractorId', String(contractorId.value));
      if (note.value) formData.append('note', note.value);
      formData.append('file', afterImageFile.value);

      await api.put('/defects/contractor-update', formData);

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
