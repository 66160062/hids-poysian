import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface Work {
  id: number;
  title: string;
  type: string;
  area: string;
  inspector: string;
  date: string;
  status: string;
  statusKey: string;
  customerName?: string;
  customerPhone?: string;
  province?: string;
}

export const useWorkListStore = defineStore('workList', () => {
  const works = ref<Work[]>([
    {
      id: 1,
      title: 'บ้านใหญ่พลังชล',
      type: 'คอนโด',
      area: '33 ตร.ม.',
      inspector: 'TEAM-A',
      date: '24/12/2026',
      status: 'กำลังดำเนินการ',
      statusKey: 'in_progress',
    },
    {
      id: 2,
      title: 'บ้านสมหวัง',
      type: 'บ้านเดี่ยว',
      area: '150 ตร.ม.',
      inspector: 'TEAM-B',
      date: '25/12/2026',
      status: 'รอดำเนินการ',
      statusKey: 'waiting',
    },
    {
      id: 3,
      title: 'โครงการพฤกษา',
      type: 'ทาวน์เฮาส์',
      area: '120 ตร.ม.',
      inspector: 'TEAM-A',
      date: '26/12/2026',
      status: 'กำลังดำเนินการ',
      statusKey: 'in_progress',
    },
    {
      id: 4,
      title: 'เดอะ เบส คอนโด',
      type: 'คอนโด',
      area: '45 ตร.ม.',
      inspector: 'TEAM-C',
      date: '27/12/2026',
      status: 'เสร็จสิ้น',
      statusKey: 'others',
    },
    {
      id: 5,
      title: 'บ้านชายเขา',
      type: 'บ้านเดี่ยว',
      area: '200 ตร.ม.',
      inspector: 'TEAM-A',
      date: '28/12/2026',
      status: 'รอดำเนินการ',
      statusKey: 'waiting',
    },
  ]);

  const nextId = computed(() =>
    works.value.length > 0 ? Math.max(...works.value.map((w) => w.id)) + 1 : 1,
  );

  function addWork(newWork: Omit<Work, 'id'>) {
    works.value.unshift({
      id: nextId.value,
      ...newWork,
    });
  }

  function removeWork(id: number) {
    works.value = works.value.filter((w) => w.id !== id);
  }

  return { works, addWork, removeWork };
});
