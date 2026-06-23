import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useContractorRepair } from 'src/stores/useContractormain';

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
  const { allDefectItems } = storeToRefs(store);

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

  // ══════════════════════════════════════════════════════
  //  uncomment เมื่อ backend พร้อม
  // ══════════════════════════════════════════════════════
  // const loading = ref(false)
  // const fetchDefect = async () => {
  //   try {
  //     loading.value = true
  //     const res  = await fetch(`/api/defects/${defectId}`)
  //     const data = await res.json()
  //     defect.value = {
  //       code:        data.code,
  //       reportedAt:  data.reportedAt,
  //       beforeImage: data.beforeImage,
  //       jobType:     data.jobType,
  //       location:    data.location,
  //       tags:        data.tags,
  //       status:      data.status,
  //     }
  //   } finally {
  //     loading.value = false
  //   }
  // }
  // onMounted(fetchDefect)

  const afterImageUrl = ref('');
  const note = ref('');
  const showSuccess = ref(false);
  const savedAfterImage = ref(found?.afterImage ?? '');
  const savedNote = ref(found?.repairNote ?? '');

  const submitRepair = () => {
    savedAfterImage.value = afterImageUrl.value;
    savedNote.value = note.value;
    showSuccess.value = true;
  };

  const confirmSuccess = async () => {
    showSuccess.value = false;
    await store.updateDefectStatus(defectId, {
      status: 'repaired',
      afterImage: savedAfterImage.value,
      note: savedNote.value,
    });
    defect.value.status = 'repaired';
    void router.back();
  };

  return {
    defect,
    afterImageUrl,
    note,
    submitRepair,
    showSuccess,
    confirmSuccess,
    savedAfterImage,
    savedNote,
  };
}
