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
  // Customer
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  // Coordinator / Contractor
  coordName?: string;
  coordPhone?: string;
  coordEmail?: string;
  coordLine?: string;
  // Location Detail
  projectName?: string;
  roomNumber?: string;
  floor?: string;
  province?: string;
  district?: string;
  subdistrict?: string;
  postalCode?: string;
  address?: string; // Full address string for display
  // Images
  housePlanImage?: string | null;
  projectImage?: string | null;
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
      customerName: 'สมชาย ใจดี',
      customerPhone: '081-234-5678',
      customerEmail: 'somchai@email.com',
      coordName: 'วิภา ก่อสร้าง',
      coordPhone: '089-876-5432',
      coordEmail: 'wipa@contractor.co.th',
      coordLine: '@wipabuild',
      projectName: 'บ้านใหญ่พลังชล',
      roomNumber: 'A101',
      floor: '1',
      province: 'ชลบุรี',
      district: 'เมือง',
      subdistrict: 'บางแสน',
      postalCode: '20000',
      address: 'เลขที่ 12 ถ.พหลโยธิน ต.บางแสน อ.เมือง จ.ชลบุรี 20000',
      projectImage:
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
      housePlanImage:
        'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80',
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
      customerName: 'มานี รักบ้าน',
      customerPhone: '062-111-2222',
      customerEmail: 'manee@gmail.com',
      coordName: 'ประยูร รับเหมา',
      coordPhone: '095-333-4444',
      coordEmail: 'prayoon@build.com',
      coordLine: '@prayoonbuild',
      projectName: 'บ้านสมหวัง',
      roomNumber: '55/3',
      floor: '-',
      province: 'กรุงเทพมหานคร',
      district: 'ลาดพร้าว',
      subdistrict: 'ลาดพร้าว',
      postalCode: '10230',
      address: 'เลขที่ 55/3 ซ.ลาดพร้าว 71 แขวงลาดพร้าว เขตลาดพร้าว กทม. 10230',
      projectImage:
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
      housePlanImage:
        'https://images.unsplash.com/photo-1626243685458-71e16c90ce88?auto=format&fit=crop&w=800&q=80',
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
      customerName: 'นิภา สุขสวัสดิ์',
      customerPhone: '083-555-6666',
      customerEmail: 'nipha@hotmail.com',
      coordName: 'ธงชัย การช่าง',
      coordPhone: '091-777-8888',
      coordEmail: 'thongchai@works.co.th',
      coordLine: '@thongworks',
      projectName: 'โครงการพฤกษา',
      roomNumber: '88',
      floor: '1',
      province: 'นนทบุรี',
      district: 'เมือง',
      subdistrict: 'บางกระสอ',
      postalCode: '11000',
      address: 'เลขที่ 88 ถ.รัตนาธิเบศร์ ต.บางกระสอ อ.เมือง จ.นนทบุรี 11000',
      projectImage:
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
      housePlanImage:
        'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80',
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
      customerName: 'ชยันต์ วรรณโชติ',
      customerPhone: '064-999-0000',
      customerEmail: 'chayan@company.com',
      coordName: 'สุพรรณ ก่อสร้าง',
      coordPhone: '086-123-4567',
      coordEmail: 'supan@build.net',
      coordLine: '@supanbuild',
      projectName: 'เดอะ เบส คอนโด',
      roomNumber: '200/5',
      floor: '5',
      province: 'เชียงใหม่',
      district: 'เมือง',
      subdistrict: 'สุเทพ',
      postalCode: '50200',
      address: 'เลขที่ 200/5 ถ.นิมมานเหมินทร์ ต.สุเทพ อ.เมือง จ.เชียงใหม่ 50200',
      projectImage:
        'https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=800&q=80',
      housePlanImage: null,
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
      customerName: 'อรุณี ธรรมศิริ',
      customerPhone: '087-456-7890',
      customerEmail: 'arunee@gmail.com',
      coordName: 'บุญมี รับเหมาใหญ่',
      coordPhone: '092-654-3210',
      coordEmail: 'boonme@bigbuild.co.th',
      coordLine: '@boonmebig',
      projectName: 'บ้านชายเขา',
      roomNumber: '15',
      floor: '-',
      province: 'เชียงราย',
      district: 'เมือง',
      subdistrict: 'ริมกก',
      postalCode: '57100',
      address: 'เลขที่ 15 ม.3 ต.ริมกก อ.เมือง จ.เชียงราย 57100',
      projectImage:
        'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80',
      housePlanImage: null,
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
