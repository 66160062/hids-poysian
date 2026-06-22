<template>
  <div class="pdf-container modern-font" :class="{ 'redacted-mode': isRedacted }">
    <!-- Controls (Not printed) -->
    <div class="no-print controls bg-white shadow-2 q-pa-sm row items-center justify-between" style="position: sticky; top: 0; z-index: 100; border-radius: 8px; margin-bottom: 20px;">
      <q-toggle v-model="isRedacted" label="ซ่อนข้อมูลส่วนบุคคล (Redact)" color="negative" />
      <q-btn color="primary" icon="print" label="พิมพ์เอกสาร (A4)" @click="printPdf" />
    </div>

    <div class="pdf-page">
      <!-- HEADER 60/40 -->
      <table class="report-table no-border-bottom">
        <tbody>
          <tr>
            <td style="width: 60%; text-align: center; font-size: 18px; font-weight: bold; background-color: #f0f0f0;">รายงานการก่อสร้างประจำวัน</td>
            <td style="width: 40%; font-size: 12px; padding: 4px;">
              <div><strong>ชื่อโครงการ:</strong> <span class="sensitive-data">{{ report?.round?.job?.projectName || '-' }}</span></div>
              <div><strong>เลขที่เอกสาร:</strong> <span class="sensitive-data">{{ report?.dailyReportId ? `DOC-${report.dailyReportId}` : '-' }}</span></div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- INFO 50/50 -->
      <table class="report-table">
        <tbody>
          <tr>
            <td style="width: 50%; padding: 4px; border-right: 1px solid #000;">
              <table class="inner-table">
                <tbody>
                  <tr><td style="width: 30%"><strong>โครงการ:</strong></td><td><span class="sensitive-data">{{ report?.round?.job?.projectName || '-' }}</span></td></tr>
                  <tr><td><strong>ผู้รับเหมา:</strong></td><td><span class="sensitive-data">{{ report?.contractorName || '-' }}</span></td></tr>
                  <tr><td><strong>ผู้รายงาน:</strong></td><td><span class="sensitive-data">{{ report?.reporterName || '-' }}</span></td></tr>
                  <tr><td><strong>ตำแหน่ง:</strong></td><td>{{ report?.position || 'วิศวกรควบคุมงาน' }}</td></tr>
                </tbody>
              </table>
            </td>
            <td style="width: 50%; padding: 4px; vertical-align: top;">
              <table class="inner-table">
                <tbody>
                  <tr>
                    <td style="width: 50%"><strong>วันที่:</strong> {{ formatDate(report?.reportDate || '') }}</td>
                    <td style="width: 50%"><strong>สภาพอากาศ:</strong> {{ report?.weather || '-' }}</td>
                  </tr>
                  <tr>
                    <td colspan="2"><strong>เวลาปฏิบัติงาน:</strong> {{ report?.workingPeriod || '-' }}</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- TASK PROGRESS (14 rows) -->
      <table class="report-table mt-4">
        <thead>
          <tr style="background-color: #f0f0f0; text-align: center;">
            <th colspan="8" style="font-size: 14px;">รายละเอียดงานปฏิบัติ</th>
          </tr>
          <tr style="background-color: #f0f0f0; text-align: center; font-size: 11px;">
            <th style="width: 5%">ลำดับ</th>
            <th style="width: 25%">รายละเอียดงาน</th>
            <th style="width: 15%">พิกัด</th>
            <th style="width: 10%">ปริมาณ</th>
            <th style="width: 10%">ทำได้จริง</th>
            <th style="width: 10%">คงเหลือ</th>
            <th style="width: 10%">หน่วย</th>
            <th style="width: 15%">หมายเหตุ</th>
          </tr>
        </thead>
        <tbody style="font-size: 11px;">
          <tr v-for="(task, index) in paddedTasks" :key="'task-'+index" style="height: 22px;">
            <td class="text-center">{{ task.no }}</td>
            <td style="padding-left: 4px;">{{ task.description }}</td>
            <td class="text-center">{{ task.location }}</td>
            <td class="text-center">{{ task.plan }}</td>
            <td class="text-center">{{ task.actual }}</td>
            <td class="text-center">{{ task.remain }}</td>
            <td class="text-center">{{ task.unit }}</td>
            <td style="padding-left: 4px;">{{ task.remark }}</td>
          </tr>
        </tbody>
      </table>

      <!-- MANPOWER & MACHINERY & ACCIDENT (Single Table to ensure row alignment) -->
      <table class="report-table mt-4">
        <thead>
          <tr style="background-color: #f0f0f0; text-align: center;">
            <th colspan="4" style="width: 32%">บุคลากร</th>
            <th colspan="4" style="width: 32%">คนงาน</th>
            <th colspan="5" style="width: 36%">เครื่องจักร</th>
          </tr>
          <tr style="background-color: #f0f0f0; text-align: center; font-size: 10px;">
            <th style="width: 4%">ลำดับ</th><th style="width: 16%">ประเภท</th><th style="width: 6%">จำนวน</th><th style="width: 6%">ชม.</th>
            <th style="width: 4%">ลำดับ</th><th style="width: 16%">ประเภท</th><th style="width: 6%">จำนวน</th><th style="width: 6%">ชม.</th>
            <th style="width: 4%">ลำดับ</th><th style="width: 12%">ประเภท</th><th style="width: 8%">ขนาด</th><th style="width: 6%">จำนวน</th><th style="width: 6%">ชม.</th>
          </tr>
        </thead>
        <tbody style="font-size: 10px;">
          <!-- Rows 1 to 9 (Machinery data rows) -->
          <tr v-for="idx in 9" :key="'r-'+idx" style="height: 18px;">
            <td class="text-center">{{ idx }}</td>
            <td>{{ paddedPersonnel[idx-1]?.type }}</td>
            <td class="text-center">{{ paddedPersonnel[idx-1]?.count }}</td>
            <td class="text-center">{{ paddedPersonnel[idx-1]?.hours }}</td>
            
            <td class="text-center">{{ idx }}</td>
            <td>{{ paddedWorkers[idx-1]?.type }}</td>
            <td class="text-center">{{ paddedWorkers[idx-1]?.count }}</td>
            <td class="text-center">{{ paddedWorkers[idx-1]?.hours }}</td>
            
            <td class="text-center">{{ idx }}</td>
            <td>{{ paddedMachinery[idx-1]?.type }}</td>
            <td class="text-center">{{ paddedMachinery[idx-1]?.size }}</td>
            <td class="text-center">{{ paddedMachinery[idx-1]?.count }}</td>
            <td class="text-center">{{ paddedMachinery[idx-1]?.hours }}</td>
          </tr>
          
          <!-- Row 10: Machinery Total -->
          <tr style="height: 18px;">
            <td class="text-center">10</td>
            <td>{{ paddedPersonnel[9]?.type }}</td>
            <td class="text-center">{{ paddedPersonnel[9]?.count }}</td>
            <td class="text-center">{{ paddedPersonnel[9]?.hours }}</td>
            
            <td class="text-center">10</td>
            <td>{{ paddedWorkers[9]?.type }}</td>
            <td class="text-center">{{ paddedWorkers[9]?.count }}</td>
            <td class="text-center">{{ paddedWorkers[9]?.hours }}</td>
            
            <td colspan="3" class="text-right text-bold" style="background-color: #f9f9f9;">รวม</td>
            <td class="text-center text-bold" style="background-color: #f9f9f9;">{{ totalMachinery.count }}</td>
            <td class="text-center text-bold" style="background-color: #f9f9f9;">{{ totalMachinery.hours }}</td>
          </tr>
          
          <!-- Rows 11 to 13: Personnel & Workers continue, Accident Report on the right -->
          <tr v-for="idx in [11, 12, 13]" :key="'r-'+idx" style="height: 18px;">
            <td class="text-center">{{ idx }}</td>
            <td>{{ paddedPersonnel[idx-1]?.type }}</td>
            <td class="text-center">{{ paddedPersonnel[idx-1]?.count }}</td>
            <td class="text-center">{{ paddedPersonnel[idx-1]?.hours }}</td>
            
            <td class="text-center">{{ idx }}</td>
            <td>{{ paddedWorkers[idx-1]?.type }}</td>
            <td class="text-center">{{ paddedWorkers[idx-1]?.count }}</td>
            <td class="text-center">{{ paddedWorkers[idx-1]?.hours }}</td>
            
            <!-- Accident Report Cell (Spans 4 rows down to cover Row 14 as well) -->
            <td colspan="5" rowspan="4" v-if="idx === 11" style="vertical-align: top; padding: 6px; text-align: left; font-size: 11px;">
              <div class="text-bold q-mb-xs">รายงานอุบัติเหตุ:</div>
              <div class="q-ml-sm">
                <div><span class="checkbox">{{ hasAccident ? ' ' : '✓' }}</span> ไม่มีอุบัติเหตุ</div>
                <div class="q-mt-sm"><span class="checkbox">{{ hasAccident ? '✓' : ' ' }}</span> มีอุบัติเหตุ <span class="dotted-line">{{ accidentCount > 0 ? accidentCount : '' }}</span> ราย</div>
              </div>
            </td>
          </tr>
          
          <!-- Row 14: Personnel & Workers Total -->
          <tr style="height: 18px; background-color: #f9f9f9;">
            <td colspan="2" class="text-right text-bold">รวม</td>
            <td class="text-center text-bold">{{ totalPersonnel.count }}</td>
            <td class="text-center text-bold">{{ totalPersonnel.hours }}</td>
            
            <td colspan="2" class="text-right text-bold">รวม</td>
            <td class="text-center text-bold">{{ totalWorkers.count }}</td>
            <td class="text-center text-bold">{{ totalWorkers.hours }}</td>
          </tr>
        </tbody>
      </table>

      <!-- ISSUES (5 rows) -->
      <table class="report-table mt-4">
        <thead>
          <tr style="background-color: #f0f0f0;">
            <th style="width: 5%; text-align: center;">ลำดับ</th>
            <th style="width: 65%; text-align: center;">ปัญหาและอุปสรรค</th>
            <th style="width: 30%; text-align: center;">หมายเหตุ</th>
          </tr>
        </thead>
        <tbody style="font-size: 11px;">
          <tr v-for="(issue, index) in paddedIssues" :key="'issue-'+index" style="height: 22px;">
            <td class="text-center">{{ index + 1 }}</td>
            <td class="text-center">{{ issue.text }}</td>
            <td class="text-center" style="color: red;">{{ issue.remark }}</td>
          </tr>
        </tbody>
      </table>

      <!-- SIGNATURES -->
      <div style="display: flex; justify-content: space-between; margin-top: 15px; text-align: center; font-size: 12px; padding: 0 40px;">
        <div>
          <div style="margin-bottom: 30px;">ลงชื่อ.........................................................ผู้รับเหมา</div>
          <div>(.........................................................)</div>
          <div class="q-mt-xs">วันที่......./......./.......</div>
        </div>
        <div>
          <div style="margin-bottom: 30px;">ลงชื่อ.........................................................ผู้ควบคุมงาน</div>
          <div class="sensitive-data">( {{ report?.reporterName || '.........................................................' }} )</div>
          <div class="q-mt-xs">วันที่......./......./.......</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { ExtendedConstructionReport } from 'src/stores/useConstructionDailyReport';

const props = defineProps<{
  report: ExtendedConstructionReport | null;
}>();

const isRedacted = ref(false);

const printPdf = () => {
  window.print();
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('th-TH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const padArray = <T>(arr: T[], length: number, emptyItem: T): T[] => {
  const result = [...arr];
  while (result.length < length) {
    result.push({ ...emptyItem });
  }
  return result.slice(0, length);
};

// TASKS
const paddedTasks = computed(() => {
  const tasks = (props.report?.workItems || []).map((w, idx) => {
    const actual = w.actualPercent || 0;
    const plan = 100;
    return {
      no: (idx + 1).toString(),
      location: w.location || '',
      description: w.description,
      plan: plan.toString() + '%',
      actual: actual.toString() + '%',
      remain: (plan - actual).toString() + '%',
      unit: w.unit || '-',
      remark: w.note || ''
    };
  });
  return padArray(tasks, 14, { no: '', location: '', description: '', plan: '', actual: '', remain: '', unit: '', remark: '' });
});

// PERSONNEL (Type = PERSONNEL) - 13 Fixed Types
const PERSONNEL_TYPES = [
  'ผู้จัดการโครงการ', 'วิศวกรโครงการ', 'ประสานงานโครงการ', 'วิศวกรสนาม', 'สถาปนิก', 
  'โฟร์แมนโครงสร้าง', 'โฟร์แมนสถาปัตย์', 'จนท.ความปลอดภัย', 'ช่างสำรวจ', 'เสมียน', 
  'พนักงานคุมสโตร์', 'พนักงานควบคุมเครื่องจักร', 'พนักงานขับรถ'
];

const paddedPersonnel = computed(() => {
  const data = props.report?.personnels || [];
  return PERSONNEL_TYPES.map(type => {
    const found = data.find(p => p.type === 'PERSONNEL' && p.name === type);
    return {
      type,
      count: found?.count ? found.count.toString() : '',
      hours: found?.hours ? found.hours.toString() : ''
    };
  });
});

const totalPersonnel = computed(() => {
  const items = (props.report?.personnels || []).filter(p => p.type === 'PERSONNEL');
  return {
    count: items.reduce((sum, item) => sum + (item.count || 0), 0).toString() || '',
    hours: items.reduce((sum, item) => sum + (item.hours || 0), 0).toString() || ''
  };
});

// WORKERS (Type = WORKER) - 13 Fixed Types
const WORKER_TYPES = [
  'หัวหน้าชุด', 'ช่างไม้', 'ช่างปูนก่อ, เท Topping', 'ช่างปูนฉาบ', 'ช่างกระเบื้อง', 
  'ช่างฝ้าเพดาน', 'ช่างติดตั้ง, สุขภัณฑ์', 'ช่างทาสี', 'กรรมกร (ชาย/หญิง)', 
  'ช่างเฟอร์นิเจอร์', 'ช่างไฟ', 'ช่างเหล็ก, ช่างเชื่อม', 'ช่างแอร์'
];

const paddedWorkers = computed(() => {
  const data = props.report?.personnels || [];
  return WORKER_TYPES.map(type => {
    const found = data.find(p => p.type === 'WORKER' && p.name === type);
    return {
      type,
      count: found?.count ? found.count.toString() : '',
      hours: found?.hours ? found.hours.toString() : ''
    };
  });
});

const totalWorkers = computed(() => {
  const items = (props.report?.personnels || []).filter(p => p.type === 'WORKER');
  return {
    count: items.reduce((sum, item) => sum + (item.count || 0), 0).toString() || '',
    hours: items.reduce((sum, item) => sum + (item.hours || 0), 0).toString() || ''
  };
});

// MACHINERY
const paddedMachinery = computed(() => {
  const items = (props.report?.machines || []).map(m => ({
    type: m.machineName,
    size: m.machineSize || '-',
    count: m.quantity ? m.quantity.toString() : '',
    hours: m.workingHours ? m.workingHours.toString() : ''
  }));
  return padArray(items, 9, { type: '', size: '', count: '', hours: '' });
});

const totalMachinery = computed(() => {
  const items = (props.report?.machines || []);
  return {
    count: items.reduce((sum, item) => sum + (item.quantity || 0), 0).toString() || '',
    hours: items.reduce((sum, item) => sum + (item.workingHours || 0), 0).toString() || ''
  };
});

// ACCIDENTS
const accidentCount = computed(() => {
  return (props.report?.accidents || []).reduce((sum, a) => sum + (a.accidentCount || 0), 0);
});
const hasAccident = computed(() => accidentCount.value > 0);

// ISSUES
const paddedIssues = computed(() => {
  const items = (props.report?.issues || []).map(i => ({
    text: i.description,
    remark: i.note || ''
  }));
  return padArray(items, 5, { text: '', remark: '' });
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');

.modern-font {
  font-family: 'Sarabun', sans-serif;
}

.pdf-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #525659;
  padding: 20px;
  min-height: 100vh;
}

.pdf-page {
  width: 210mm;
  min-height: 297mm;
  background-color: white;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  padding: 10mm;
  position: relative;
  box-sizing: border-box;
  color: #000;
  overflow: hidden;
}

table {
  border-collapse: collapse;
  width: 100%;
}

td, th {
  padding: 2px 4px;
}

.report-table {
  width: 100%;
  border: 1px solid #000;
}

.report-table th, .report-table td {
  border: 1px solid #000;
}

.report-table.no-border-bottom {
  border-bottom: none;
}

.inner-table {
  width: 100%;
  border: none;
}
.inner-table td {
  border: none;
  padding: 2px 4px;
}

.mt-4 {
  margin-top: 6px;
}

.text-center {
  text-align: center;
}

.text-right {
  text-align: right;
}

.text-bold {
  font-weight: bold;
}

.checkbox {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 1px solid #000;
  text-align: center;
  line-height: 10px;
  font-size: 10px;
  margin-right: 4px;
}

.dotted-line {
  border-bottom: 1px dotted #000;
  display: inline-block;
  width: 30px;
  text-align: center;
}

.sensitive-data {
  transition: all 0.3s ease;
}

.redacted-mode .sensitive-data {
  background-color: #000 !important;
  color: #000 !important;
  user-select: none;
}

@media print {
  @page {
    size: A4;
    margin: 10mm;
  }
  
  body {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  
  .pdf-container {
    background-color: transparent;
    padding: 0;
  }
  
  .pdf-page {
    width: 100%;
    min-height: auto;
    box-shadow: none;
    padding: 0;
    margin: 0;
    page-break-after: auto;
  }
  
  .no-print {
    display: none !important;
  }
}
</style>
