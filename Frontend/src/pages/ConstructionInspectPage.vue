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
            <div class="text-caption text-grey-8">เริ่มเวลา</div>
            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <q-input outlined dense v-model="form.startTime" placeholder="กรอกเวลาเริ่ม" bg-color="white" readonly>
                  <template v-slot:append>
                    <q-icon name="access_time" class="cursor-pointer">
                      <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                        <q-time v-model="form.startTime">
                          <div class="row items-center justify-end">
                            <q-btn v-close-popup label="Close" color="primary" flat />
                          </div>
                        </q-time>
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
              </div>
              <div class="col-6">
                <q-input outlined dense v-model="form.endTime" placeholder="กรอกเวลาจบ" bg-color="white" readonly>
                  <template v-slot:append>
                    <q-icon name="access_time" class="cursor-pointer">
                      <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                        <q-time v-model="form.endTime">
                          <div class="row items-center justify-end">
                            <q-btn v-close-popup label="Close" color="primary" flat />
                          </div>
                        </q-time>
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
              </div>
            </div>

            <div class="text-caption text-grey-8 q-mt-sm">สภาพอากาศ</div>
            <q-select outlined dense v-model="form.weather" :options="weatherOptions" bg-color="white" />
          </q-card-section>
        </q-card>

        <!-- 2. รายละเอียดงานที่ปฏิบัติ -->
        <q-card flat bordered class="q-mb-md ui-card">
          <q-card-section class="q-pa-sm bg-grey-2 text-dark text-weight-bold row items-center">
            <q-icon name="grid_on" size="18px" class="q-mr-xs text-primary" />
            รายละเอียดงานที่ปฏิบัติ
          </q-card-section>
          <q-list separator>
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
          <q-list separator>
            <q-item clickable v-ripple @click="addPersonnel" class="bg-white">
              <q-item-section class="text-primary text-weight-medium">บุคลากร</q-item-section>
              <q-item-section side>
                <q-icon name="add_circle_outline" color="primary" size="24px" />
              </q-item-section>
            </q-item>
            <q-item clickable v-ripple @click="addWorker" class="bg-white">
              <q-item-section class="text-primary text-weight-medium">คนงาน</q-item-section>
              <q-item-section side>
                <q-icon name="add_circle_outline" color="primary" size="24px" />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>

        <!-- 4. รายงานเพิ่มเติมหรือปัญหาในการทำงาน -->
        <q-card flat bordered class="q-mb-md ui-card">
          <q-card-section class="q-pa-sm bg-grey-2 text-dark text-weight-bold row items-center">
            <q-icon name="report_problem" size="18px" class="q-mr-xs text-primary" />
            รายงานเพิ่มเติมหรือปัญหาในการทำงาน
          </q-card-section>
          <q-list separator>
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
        @click="submitReport"
      />
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const router = useRouter();
// const roundId = route.params.roundId;

const form = ref({
  startTime: '',
  endTime: '',
  weather: 'Sunny',
});

const weatherOptions = ['Sunny', 'Cloudy', 'Rainy', 'Stormy'];

const addWorkDetail = () => {
  $q.notify({ message: 'ฟังก์ชันเพิ่มรายละเอียดงาน (รอดำเนินการ)', color: 'info' });
};

const addPersonnel = () => {
  $q.notify({ message: 'ฟังก์ชันเพิ่มบุคลากร (รอดำเนินการ)', color: 'info' });
};

const addWorker = () => {
  $q.notify({ message: 'ฟังก์ชันเพิ่มคนงาน (รอดำเนินการ)', color: 'info' });
};

const addAdditionalNote = () => {
  $q.notify({ message: 'ฟังก์ชันเพิ่มรายงานเพิ่มเติม (รอดำเนินการ)', color: 'info' });
};

const submitReport = () => {
  $q.notify({ message: 'ส่งรายงานประจำวันเรียบร้อยแล้ว', color: 'positive' });
  router.back();
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
