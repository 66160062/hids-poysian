<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <q-page class="q-pa-md bg-grey-1 modern-font" style="padding-bottom: 80px">
        
        <!-- 1. ข้อมูลทั่วไป -->
        <q-card flat bordered class="q-mb-md ui-card">
          <q-card-section class="q-pa-sm bg-grey-2 text-primary text-weight-bold row items-center">
            <q-icon name="info" size="20px" class="q-mr-xs" />
            ข้อมูลทั่วไป
          </q-card-section>
          <q-card-section class="q-pa-md column q-gutter-y-sm">
            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <div class="text-caption text-grey-8 q-mb-xs">เริ่มเวลา</div>
                <!-- เปลี่ยนไปใช้ Native Time Input ของ HTML5 ที่จะเด้ง Time Picker บนมือถือได้ดีกว่า -->
                <q-input outlined dense type="time" v-model="form.startTime" bg-color="white" />
              </div>
              <div class="col-6">
                <div class="text-caption text-grey-8 q-mb-xs">เวลาจบ</div>
                <q-input outlined dense type="time" v-model="form.endTime" bg-color="white" />
              </div>
            </div>

            <div class="text-caption text-grey-8 q-mt-sm">สภาพอากาศ</div>
            <q-btn-toggle
              v-model="form.weather"
              spread
              no-caps
              rounded
              unelevated
              toggle-color="primary"
              color="white"
              text-color="grey-8"
              :options="[
                { label: 'แดด', value: 'Sunny' },
                { label: 'เมฆ', value: 'Cloudy' },
                { label: 'ฝน', value: 'Rainy' },
                { label: 'พายุ', value: 'Stormy' },
              ]"
              class="q-mt-xs"
              style="border: 1px solid #e0e0e0; border-radius: 8px;"
            />
          </q-card-section>
        </q-card>

        <!-- 2. รายละเอียดงานที่ปฏิบัติ -->
        <q-card flat bordered class="q-mb-md ui-card">
          <q-card-section class="q-pa-sm bg-grey-2 text-dark text-weight-bold row items-center">
            <q-icon name="grid_on" size="18px" class="q-mr-xs text-primary" />
            รายละเอียดงานที่ปฏิบัติ
          </q-card-section>
          <q-list separator>
            <!-- ส่วนที่เพิ่มข้อมูลเข้ามาแล้ว -->
            <q-item v-for="work in workDetails" :key="work.id" class="bg-white">
              <q-item-section>
                <q-item-label class="text-weight-bold text-primary">{{ work.name }}</q-item-label>
                <q-item-label caption>พิกัด: {{ work.location || '-' }} | หน่วย: {{ work.unit || '-' }}</q-item-label>
                <q-item-label caption>ทำได้จริง: {{ work.actual }}%</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-btn flat round dense icon="delete" color="negative" @click="removeWork(work.id)" />
              </q-item-section>
            </q-item>

            <!-- ปุ่มกดเพิ่มข้อมูล -->
            <q-item clickable v-ripple @click="addWorkDetail" class="bg-white">
              <q-item-section class="text-primary text-weight-medium">เพิ่มรายละเอียดงาน</q-item-section>
              <q-item-section side>
                <q-icon name="add_circle_outline" color="primary" size="24px" />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>

        <!-- 3. รายละเอียดผู้มีส่วนเกี่ยวข้อง -->
        <q-card flat bordered class="q-mb-md ui-card">
          <q-card-section class="q-pa-sm bg-grey-2 text-dark text-weight-bold row items-center">
            <q-icon name="people" size="18px" class="q-mr-xs text-primary" />
            รายละเอียดผู้มีส่วนเกี่ยวข้อง
          </q-card-section>
          <div class="row">
            <!-- ซ้าย: บุคลากร -->
            <div class="col-6" style="border-right: 1px solid #e0e0e0;">
              <div class="q-pa-sm bg-blue-1 text-blue-9 text-weight-bold text-center" style="font-size: 13px;">บุคลากร</div>
              <q-list separator>
                <q-item v-for="p in personnelList" :key="p.id" class="bg-white q-pa-sm">
                  <q-item-section>
                    <q-item-label class="text-weight-bold" style="font-size: 12px;">{{ p.name }}</q-item-label>
                  </q-item-section>
                  <q-item-section side class="row items-center q-pa-none">
                    <div class="row items-center">
                      <q-badge color="blue-8" class="q-mr-xs">{{ p.count }}</q-badge>
                      <q-btn flat round dense icon="delete" color="negative" size="sm" @click="removePersonnel(p.id)" />
                    </div>
                  </q-item-section>
                </q-item>

                <q-item clickable v-ripple @click="addPersonnel" class="bg-white q-pa-sm justify-center">
                  <q-item-section avatar class="min-width-0 q-pr-none">
                    <q-icon name="add_circle_outline" color="blue-8" size="20px" />
                  </q-item-section>
                  <q-item-section class="text-blue-8 text-weight-medium" style="font-size: 12px;">เพิ่มบุคลากร</q-item-section>
                </q-item>
              </q-list>
            </div>

            <!-- ขวา: คนงาน -->
            <div class="col-6">
              <div class="q-pa-sm bg-orange-1 text-orange-9 text-weight-bold text-center" style="font-size: 13px;">คนงาน</div>
              <q-list separator>
                <q-item v-for="w in workerList" :key="w.id" class="bg-white q-pa-sm">
                  <q-item-section>
                    <q-item-label class="text-weight-bold" style="font-size: 12px;">{{ w.name }}</q-item-label>
                  </q-item-section>
                  <q-item-section side class="row items-center q-pa-none">
                    <div class="row items-center">
                      <q-badge color="orange-8" class="q-mr-xs">{{ w.count }}</q-badge>
                      <q-btn flat round dense icon="delete" color="negative" size="sm" @click="removeWorker(w.id)" />
                    </div>
                  </q-item-section>
                </q-item>

                <q-item clickable v-ripple @click="addWorker" class="bg-white q-pa-sm justify-center">
                  <q-item-section avatar class="min-width-0 q-pr-none">
                    <q-icon name="add_circle_outline" color="orange-8" size="20px" />
                  </q-item-section>
                  <q-item-section class="text-orange-8 text-weight-medium" style="font-size: 12px;">เพิ่มคนงาน</q-item-section>
                </q-item>
              </q-list>
            </div>
          </div>
        </q-card>

        <!-- 4. รายงานเพิ่มเติมหรือปัญหาในการทำงาน -->
        <q-card flat bordered class="q-mb-md ui-card">
          <q-card-section class="q-pa-sm bg-grey-2 text-dark text-weight-bold row items-center">
            <q-icon name="report_problem" size="18px" class="q-mr-xs text-primary" />
            รายงานเพิ่มเติมหรือปัญหาในการทำงาน
          </q-card-section>
          <q-list separator>
            <q-item v-for="note in notesList" :key="note.id" class="bg-white">
              <q-item-section>
                <q-item-label>{{ note.text }}</q-item-label>
                <q-item-label caption class="text-orange-8 text-weight-bold">หมายเหตุ: {{ note.status }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-btn flat round dense icon="delete" color="negative" size="sm" @click="removeNote(note.id)" />
              </q-item-section>
            </q-item>

            <q-item clickable v-ripple @click="addAdditionalNote" class="bg-white">
              <q-item-section class="text-primary text-weight-medium">เพิ่มรายละเอียดรายงานเพิ่มเติม</q-item-section>
              <q-item-section side>
                <q-icon name="add_circle_outline" color="primary" size="24px" />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>

        <!-- 5. PROJECT PHOTOS -->
        <div class="text-subtitle2 text-weight-bold row items-center q-mb-sm text-uppercase text-dark">
          <q-icon name="photo_camera" size="20px" class="q-mr-xs text-primary" />
          PROJECT PHOTOS
        </div>

        <q-card flat bordered class="q-mb-sm upload-box flex flex-center" style="min-height: 120px;" clickable v-ripple>
          <div class="column items-center text-grey-6">
            <q-icon name="image" size="32px" />
            <div class="text-caption text-weight-medium q-mt-xs" style="font-size: 10px;">PRIMARY PANORAMA VIEW (REQUIRED)</div>
          </div>
        </q-card>

        <!-- Additional Photos Grid (max 6) -->
        <div class="row q-col-gutter-sm">
          <div class="col-6" v-for="i in 6" :key="i">
            <q-card flat bordered class="upload-box flex flex-center" style="min-height: 100px;" clickable v-ripple>
              <q-icon name="add" size="24px" color="grey-5" />
            </q-card>
          </div>
        </div>

      </q-page>
    </q-page-container>

    <q-footer class="bg-transparent q-px-md q-pb-lg">
      <q-btn
        color="primary"
        label="ส่งรายงานประจำวัน"
        class="full-width text-weight-bold shadow-3"
        style="border-radius: 8px; height: 48px; font-size: 16px;"
        :loading="store.isSubmitting"
        :disable="store.isSubmitting"
        @click="submitReport"
      />
    </q-footer>

    <!-- Dialog: เพิ่มรายละเอียดงาน -->
    <q-dialog v-model="workDialog" persistent>
      <q-card style="min-width: 340px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        <q-card-section class="bg-primary text-white row items-center q-pb-sm">
          <q-icon name="assignment" size="24px" class="q-mr-sm" />
          <div class="text-h6 text-weight-bold" style="font-size: 18px;">เพิ่มรายละเอียดงาน</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>
        
        <q-card-section class="q-pt-md column q-gutter-y-md">
          <q-input 
            outlined 
            dense 
            v-model="newWork.name" 
            autofocus 
            label="รายละเอียดงานที่ปฏิบัติ" 
            placeholder="เช่น เทปูน, ทาสี" 
            bg-color="white" 
            hide-bottom-space 
          />
          
          <div class="row q-col-gutter-sm">
            <div class="col-12 col-sm-6">
              <q-select outlined dense v-model="newWork.location" :options="roomOptions" label="พิกัด / ห้อง" bg-color="white" />
            </div>
            <div class="col-12 col-sm-6">
              <q-select outlined dense v-model="newWork.unit" :options="unitOptions" label="หน่วยของงาน" bg-color="white" />
            </div>
          </div>
          
          <q-input 
            outlined 
            dense 
            type="number" 
            v-model.number="newWork.actual" 
            label="ทำได้จริง (%)" 
            placeholder="0 - 100"
            bg-color="white"
            suffix="%"
            hide-bottom-space
          />
        </q-card-section>
        
        <q-card-actions align="right" class="bg-grey-1 q-pa-md">
          <q-btn flat label="ยกเลิก" color="grey-8" v-close-popup class="text-weight-medium" style="border-radius: 8px;" />
          <q-btn unelevated label="บันทึกข้อมูล" color="primary" @click="saveWork" class="text-weight-bold" style="border-radius: 8px; padding: 0 16px;" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialog: เพิ่มบุคลากร/คนงาน -->
    <q-dialog v-model="personDialog" persistent>
      <q-card style="min-width: 320px; border-radius: 12px;">
        <q-card-section :class="isWorker ? 'bg-orange-8 text-white' : 'bg-blue-8 text-white'">
          <div class="text-h6">{{ isWorker ? 'เพิ่มคนงาน' : 'เพิ่มบุคลากร' }}</div>
        </q-card-section>
        <q-card-section class="q-pt-md column q-gutter-y-md">
          <q-select 
            outlined dense 
            v-model="newPerson.name" 
            :options="isWorker ? workerOptions : personnelOptions" 
            :label="isWorker ? 'ประเภทคนงาน / ทีม' : 'ตำแหน่งบุคลากร'" 
            autofocus 
          />
          <div class="row items-center justify-between">
            <span class="text-subtitle2 text-grey-8">จำนวนคน</span>
            <div class="row items-center q-gutter-x-sm">
              <q-btn round dense flat color="negative" icon="remove_circle" size="md" @click="newPerson.count > 1 ? newPerson.count-- : 1" />
              <q-input outlined dense type="number" v-model.number="newPerson.count" input-class="text-center text-weight-bold" style="width: 80px;" />
              <q-btn round dense flat :color="isWorker ? 'orange-8' : 'blue-8'" icon="add_circle" size="md" @click="newPerson.count++" />
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right" :class="isWorker ? 'text-orange-8' : 'text-blue-8'">
          <q-btn flat label="ยกเลิก" v-close-popup />
          <q-btn flat label="บันทึกข้อมูล" @click="savePerson" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialog: เพิ่มรายงานเพิ่มเติม -->
    <q-dialog v-model="noteDialog" persistent>
      <q-card style="min-width: 320px; border-radius: 12px;">
        <q-card-section class="bg-negative text-white">
          <div class="text-h6">รายงานเพิ่มเติม / ปัญหา</div>
        </q-card-section>
        <q-card-section class="q-pt-md column q-gutter-y-md">
          <q-input outlined dense v-model="newNote.text" type="textarea" rows="3" label="รายละเอียดปัญหา หรือข้อเสนอแนะ" autofocus />
          <div class="text-caption text-grey-8 q-mb-xs">หมวดหมู่</div>
          <q-btn-toggle
            v-model="newNote.status"
            spread
            no-caps
            rounded
            unelevated
            toggle-color="orange-8"
            color="white"
            text-color="grey-8"
            :options="[
              { label: 'ต้องติดตามผล', value: 'ต้องติดตามผล' },
              { label: 'รอดำเนินการ', value: 'รอดำเนินการ' },
              { label: 'รับทราบแล้ว', value: 'รับทราบแล้ว' },
            ]"
            style="border: 1px solid #e0e0e0; border-radius: 8px;"
          />
        </q-card-section>
        <q-card-actions align="right" class="text-negative">
          <q-btn flat label="ยกเลิก" v-close-popup />
          <q-btn flat label="บันทึกข้อมูล" @click="saveNote" />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import { useConstructionDailyReportStore } from 'src/stores/useConstructionDailyReport';
import type { ConstructionDailyReportPayload } from 'src/stores/useConstructionDailyReport';

const $q = useQuasar();
const router = useRouter();
const route = useRoute();
const store = useConstructionDailyReportStore();

// roundId จาก route params (เช่น /inspector/job/:roundId/construction-inspect)
const roundId = Number(route.params.roundId);

// 1. General Info
const form = ref({
  startTime: '',
  endTime: '',
  weather: 'Sunny',
});

// 2. Work Details
const roomOptions = ['ห้องรับแขก', 'ห้องนอน', 'ห้องน้ำ', 'ห้องครัว', 'ระเบียง', 'รอบตัวบ้าน', 'หลังคา', 'ส่วนกลาง'];
const unitOptions = ['ตร.ม.', 'เมตร', 'ชิ้น', 'จุด', 'ชุด'];
const workDetails = ref<{id: number, name: string, location: string, unit: string, actual: number}[]>([]);
const workDialog = ref(false);
const newWork = ref({ name: '', location: '', unit: '', actual: 0 });

const addWorkDetail = () => {
  newWork.value = { name: '', location: '', unit: '', actual: 0 };
  workDialog.value = true;
};
const saveWork = () => {
  if (!newWork.value.name) return $q.notify({ message: 'กรุณากรอกรายละเอียดงาน', color: 'warning' });
  if (newWork.value.actual === null || newWork.value.actual === undefined || newWork.value.actual.toString() === '') {
    return $q.notify({ message: 'กรุณากรอกเปอร์เซ็นต์ (ทำได้จริง)', color: 'warning' });
  }
  if (newWork.value.actual < 0 || newWork.value.actual > 100) {
    return $q.notify({ message: 'เปอร์เซ็นต์ต้องอยู่ระหว่าง 0 - 100', color: 'warning' });
  }
  workDetails.value.push({ id: Date.now(), ...newWork.value });
  workDialog.value = false;
};
const removeWork = (id: number) => {
  workDetails.value = workDetails.value.filter(w => w.id !== id);
};

// 3. Personnel / Workers
const personnelList = ref<{id: number, name: string, count: number}[]>([]);
const workerList = ref<{id: number, name: string, count: number}[]>([]);
const personDialog = ref(false);
const isWorker = ref(false);
const newPerson = ref({ name: '', count: 1 });

const personnelOptions = [
  'ผู้จัดการโครงการ', 'วิศวกรโครงการ', 'ประสานงานโครงการ', 'วิศวกรสนาม', 'สถาปนิก', 
  'โฟร์แมนโครงสร้าง', 'โฟร์แมนสถาปัตย์', 'จนท.ความปลอดภัย', 'ช่างสำรวจ', 'เสมียน', 
  'พนักงานคุมสโตร์', 'พนักงานควบคุมเครื่องจักร', 'พนักงานขับรถ'
];

const workerOptions = [
  'หัวหน้าชุด', 'ช่างไม้', 'ช่างปูนก่อ, เท Topping', 'ช่างปูนฉาบ', 'ช่างกระเบื้อง', 
  'ช่างฝ้าเพดาน', 'ช่างติดตั้ง, สุขภัณฑ์', 'ช่างทาสี', 'กรรมกร (ชาย/หญิง)', 
  'ช่างเฟอร์นิเจอร์', 'ช่างไฟ', 'ช่างเหล็ก, ช่างเชื่อม', 'ช่างแอร์'
];

const addPersonnel = () => {
  isWorker.value = false;
  newPerson.value = { name: '', count: 1 };
  personDialog.value = true;
};
const addWorker = () => {
  isWorker.value = true;
  newPerson.value = { name: '', count: 1 };
  personDialog.value = true;
};
const savePerson = () => {
  if (!newPerson.value.name) return $q.notify({ message: 'กรุณากรอกชื่อหรือตำแหน่ง', color: 'warning' });
  if (newPerson.value.count < 1) newPerson.value.count = 1;
  if (isWorker.value) {
    workerList.value.push({ id: Date.now(), ...newPerson.value });
  } else {
    personnelList.value.push({ id: Date.now(), ...newPerson.value });
  }
  personDialog.value = false;
};
const removePersonnel = (id: number) => {
  personnelList.value = personnelList.value.filter(p => p.id !== id);
};
const removeWorker = (id: number) => {
  workerList.value = workerList.value.filter(w => w.id !== id);
};

// 4. Additional Notes
const notesList = ref<{id: number, text: string, status: string}[]>([]);
const noteDialog = ref(false);
const newNote = ref({ text: '', status: 'ต้องติดตามผล' });

const addAdditionalNote = () => {
  newNote.value = { text: '', status: 'ต้องติดตามผล' };
  noteDialog.value = true;
};
const saveNote = () => {
  if (!newNote.value.text) return $q.notify({ message: 'กรุณากรอกรายละเอียดปัญหา', color: 'warning' });
  notesList.value.push({ id: Date.now(), ...newNote.value });
  noteDialog.value = false;
};
const removeNote = (id: number) => {
  notesList.value = notesList.value.filter(n => n.id !== id);
};

// 5. Submit — แปลง form data เป็น API payload แล้วส่ง POST
const submitReport = async () => {
  const payload: ConstructionDailyReportPayload = {
    roundId,
    reportDate: new Date().toISOString().slice(0, 10), // วันนี้ (YYYY-MM-DD)

    // แปลง workDetails → workItems
    workItems: workDetails.value.map((w, index) => ({
      description: w.name,
      location: w.location,
      unit: w.unit,
      actualPercent: w.actual,
      sequence: index + 1,
    })),

    // รวม personnelList + workerList → personnels
    personnels: [
      ...personnelList.value.map((p) => ({
        name: p.name,
        type: 'PERSONNEL' as const,
        count: p.count,
      })),
      ...workerList.value.map((w) => ({
        name: w.name,
        type: 'WORKER' as const,
        count: w.count,
      })),
    ],

    // แปลง notesList → issues
    issues: notesList.value.map((n) => ({
      description: n.text,
      note: n.status,
    })),
  };

  if (form.value.weather) {
    payload.weather = form.value.weather;
  }

  if (form.value.startTime && form.value.endTime) {
    payload.workingPeriod = `${form.value.startTime} - ${form.value.endTime}`;
  }

  try {
    await store.submitReport(payload);
    $q.notify({
      message: 'ส่งรายงานประจำวันเรียบร้อยแล้ว',
      color: 'positive',
      icon: 'check_circle',
    });
    router.back();
  } catch {
    $q.notify({
      message: store.submitError ?? 'เกิดข้อผิดพลาดในการบันทึกข้อมูล',
      color: 'negative',
      icon: 'error',
    });
  }
};
</script>

<style scoped>
.modern-font {
  font-family: 'Inter', 'Noto Sans Thai', -apple-system, BlinkMacSystemFont, sans-serif;
}

.ui-card {
  border-radius: 8px;
  border-color: #e0e0e0;
  overflow: hidden;
}

.upload-box {
  border: 1px dashed #b0bec5;
  border-radius: 8px;
  background-color: #f8f9fa;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.upload-box:hover {
  background-color: #f1f3f4;
}
</style>
