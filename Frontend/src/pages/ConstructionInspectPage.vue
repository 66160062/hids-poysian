<template>
  <q-layout view="lHh Lpr lFf">
    <q-header v-if="route.path.includes('/admin')" class="bg-white" flat bordered>
      <div class="row items-center q-pt-md q-pb-sm q-px-md relative-position">
        <q-btn flat round dense icon="arrow_back_ios_new" color="primary" @click="router.back()" />
        <div class="text-h6 text-weight-bold q-ml-sm text-primary">แก้ไขการตรวจก่อสร้าง</div>
      </div>
    </q-header>

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
                <div class="text-caption text-grey-8 q-mb-xs">เวลาเริ่ม</div>
                <q-input type="time" outlined dense v-model="form.startTime" bg-color="white" hide-bottom-space>
                  <template v-slot:append>
                    <q-btn flat dense color="primary" label="ตอนนี้" size="sm" @click="setCurrentTime('startTime')" />
                  </template>
                </q-input>
              </div>
              <div class="col-6">
                <div class="text-caption text-grey-8 q-mb-xs">เวลาจบ</div>
                <q-input type="time" outlined dense v-model="form.endTime" bg-color="white" hide-bottom-space>
                  <template v-slot:append>
                    <q-btn flat dense color="primary" label="ตอนนี้" size="sm" @click="setCurrentTime('endTime')" />
                  </template>
                </q-input>
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
            <q-space />
            <span v-if="workDetails.length > 0" class="text-caption text-primary bg-blue-1 q-px-sm" style="border-radius: 4px;">{{ workSummary }}</span>
          </q-card-section>
          <q-list separator>
            <!-- ส่วนที่เพิ่มข้อมูลเข้ามาแล้ว -->
            <q-item v-for="work in workDetails" :key="work.id" class="bg-white">
              <q-item-section>
                <q-item-label class="text-weight-bold text-primary">{{ work.name }}</q-item-label>
                <q-item-label caption>พิกัด: {{ work.location || '-' }} | หน่วย: {{ work.unit || '-' }}</q-item-label>
                <q-item-label caption>ทำได้จริง: {{ work.actual }}%</q-item-label>
              </q-item-section>
              <q-item-section side class="row items-center q-pa-none">
                <q-btn flat round dense icon="delete" color="negative" size="sm" @click="removeWork(work.id)" />
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
              <div class="row items-center justify-center q-pa-sm bg-blue-1 text-blue-9 text-weight-bold" style="font-size: 13px;">
                บุคลากร
                <q-space />
                <span v-if="personnelList.length > 0" class="text-caption text-weight-regular">{{ personnelSummary }}</span>
              </div>
              <q-list separator>
                <q-item v-for="p in personnelList" :key="p.id" class="bg-white q-pa-sm">
                  <q-item-section>
                    <q-item-label class="text-weight-bold" style="font-size: 12px;">{{ p.name }}</q-item-label>
                    <q-item-label caption v-if="p.hours" style="font-size: 11px;">เวลา: {{ p.hours }} ชม.</q-item-label>
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
              <div class="row items-center justify-center q-pa-sm bg-orange-1 text-orange-9 text-weight-bold" style="font-size: 13px;">
                คนงาน
                <q-space />
                <span v-if="workerList.length > 0" class="text-caption text-weight-regular">{{ workerSummary }}</span>
              </div>
              <q-list separator>
                <q-item v-for="w in workerList" :key="w.id" class="bg-white q-pa-sm">
                  <q-item-section>
                    <q-item-label class="text-weight-bold" style="font-size: 12px;">{{ w.name }}</q-item-label>
                    <q-item-label caption v-if="w.hours" style="font-size: 11px;">เวลา: {{ w.hours }} ชม.</q-item-label>
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

        <!-- 4. เครื่องจักร/อุปกรณ์ -->
        <q-card flat bordered class="q-mb-md ui-card">
          <q-card-section class="q-pa-sm bg-grey-2 text-dark text-weight-bold row items-center">
            <q-icon name="construction" size="18px" class="q-mr-xs text-teal-8" />
            เครื่องจักร/อุปกรณ์
          </q-card-section>
          <q-list separator>
            <q-item v-for="m in machineList" :key="m.id" class="bg-white">
              <q-item-section>
                <q-item-label class="text-weight-bold text-teal-8">{{ m.name }}</q-item-label>
                <q-item-label caption>ขนาด: {{ m.size || '-' }} | จำนวน: {{ m.quantity }} | ชม.: {{ m.hours ?? '-' }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-btn flat round dense icon="delete" color="negative" size="sm" @click="removeMachine(m.id)" />
              </q-item-section>
            </q-item>

            <q-item clickable v-ripple @click="addMachine" class="bg-white">
              <q-item-section class="text-teal-8 text-weight-medium">เพิ่มเครื่องจักร/อุปกรณ์</q-item-section>
              <q-item-section side>
                <q-icon name="add_circle_outline" color="teal-8" size="24px" />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>

        <!-- 5. รายงานอุบัติเหตุ -->
        <q-card flat bordered class="q-mb-md ui-card">
          <q-card-section class="q-pa-sm bg-grey-2 text-dark text-weight-bold row items-center">
            <q-icon name="health_and_safety" size="18px" class="q-mr-xs text-red-8" />
            รายงานอุบัติเหตุ
            <q-space />
            <span v-if="accidentList.length > 0" class="text-caption text-red-8 bg-red-1 q-px-sm" style="border-radius: 4px;">{{ accidentSummary }}</span>
          </q-card-section>
          <q-list separator>
            <q-item v-for="a in accidentList" :key="a.id" class="bg-white">
              <q-item-section>
                <q-item-label class="text-weight-bold text-red-8">เกิดอุบัติเหตุหรือมีผู้บาดเจ็บ</q-item-label>
                <q-item-label caption>จำนวน: {{ a.count }} ราย</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-btn flat round dense icon="delete" color="negative" size="sm" @click="removeAccident(a.id)" />
              </q-item-section>
            </q-item>

            <q-item clickable v-ripple @click="addAccident" class="bg-white">
              <q-item-section class="text-red-8 text-weight-medium">เพิ่มรายงานอุบัติเหตุ</q-item-section>
              <q-item-section side>
                <q-icon name="add_circle_outline" color="red-8" size="24px" />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>

        <!-- 6. รายงานเพิ่มเติมหรือปัญหาในการทำงาน -->
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

        <!-- 7. PROJECT PHOTOS -->
        <div class="text-subtitle2 text-weight-bold row items-center q-mb-sm text-uppercase text-dark">
          <q-icon name="photo_camera" size="20px" class="q-mr-xs text-primary" />
          PROJECT PHOTOS
        </div>

        <!-- กล่องอัปโหลด Panorama -->
        <div class="q-mb-md">
          <div class="text-caption text-weight-bold q-mb-xs text-grey-8">รูปภาพพาโนรามา (บังคับ)</div>
          <q-card flat bordered class="upload-box flex flex-center relative-position" style="min-height: 120px; overflow: hidden;" clickable v-ripple @click="triggerPanoramaInput">
            <template v-if="panoramaPreview">
              <q-img :src="panoramaPreview" style="width: 100%; height: 100%; object-fit: cover; position: absolute; top: 0; left: 0;" />
              <q-btn
                round
                color="negative"
                icon="close"
                size="sm"
                class="absolute-top-right q-ma-xs shadow-2"
                @click.stop.prevent="removePanorama"
                style="z-index: 10;"
              />
            </template>
            <template v-else>
              <div class="column items-center text-grey-6">
                <q-icon name="panorama" size="32px" color="primary" />
                <div class="text-caption text-weight-medium q-mt-xs text-primary" style="font-size: 10px;">PRIMARY PANORAMA VIEW (REQUIRED)</div>
              </div>
            </template>
          </q-card>
        </div>
        <!-- ซ่อน Input สำหรับอัปโหลด Panorama ไว้ -->
        <input type="file" accept="image/*" ref="panoramaInput" style="display: none" @change="onPanoramaUpload" />

        <!-- PROJECT PHOTOS: Single 6-slot (or more) Grid -->
        <!-- PROJECT PHOTOS: Single 6-slot (or more) Grid -->
        <div class="q-mb-lg">
          <div class="text-subtitle2 text-weight-bold q-mb-sm text-dark text-uppercase">PROJECT PHOTOS</div>
          <div class="row q-col-gutter-sm">
            <div class="col-6" v-for="(item, index) in gridItems" :key="index">
              
              <!-- Case: Photo -->
              <template v-if="item.type === 'photo' && item.photo">
                <q-card flat bordered class="q-pa-xs bg-white h-100 relative-position">
                  <q-img :src="item.photo.preview" style="height: 120px; border-radius: 4px;" fit="cover" />
                  
                  <!-- ปุ่มลบ (กากบาท) มุมขวาบน -->
                  <q-btn round dense color="negative" icon="close" size="sm" class="absolute-top-right q-ma-xs shadow-2" @click.stop.prevent="removePhoto(item.photo.id)" style="z-index: 10;" />
                  
                  <!-- Tag ชื่องาน มุมซ้ายล่าง -->
                  <div class="absolute-bottom-left q-pa-xs" style="z-index: 5;">
                    <q-badge color="primary" text-color="white" style="opacity: 0.9;">
                      {{ item.workName }}
                    </q-badge>
                  </div>
                </q-card>
              </template>

              <!-- Case: Add Button -->
              <template v-else-if="item.type === 'add_button'">
                <q-card flat bordered class="upload-box flex flex-center full-height bg-blue-50" style="min-height: 120px; border: 2px dashed #1976D2;" clickable v-ripple @click="triggerFileInput(item.workName || undefined)">
                  <div class="column items-center text-center q-pa-sm">
                    <q-icon name="add_a_photo" size="28px" color="primary" />
                    <div class="text-caption text-weight-bold q-mt-xs text-primary" style="font-size: 12px; line-height: 1.2;">
                      เพิ่มรูป: {{ item.workName }}
                    </div>
                  </div>
                </q-card>
              </template>

              <!-- Case: Empty Slot -->
              <template v-else>
                <q-card flat bordered class="flex flex-center full-height bg-grey-2" style="min-height: 120px; border: 1px dashed #e0e0e0; opacity: 0.5;">
                  <q-icon name="photo" size="24px" color="grey-4" />
                </q-card>
              </template>

            </div>
          </div>
        </div>

        <input type="file" ref="fileInput" accept="image/*" style="display: none" @change="handleFileChange" />

      </q-page>
    </q-page-container>

    <q-footer class="bg-transparent q-px-md q-pb-lg">
      <q-btn
        color="primary"
        :label="route.path.includes('/admin') ? 'บันทึกการแก้ไข' : 'ส่งรายงานประจำวัน'"
        class="full-width text-weight-bold shadow-3"
        style="border-radius: 8px; height: 48px; font-size: 16px;"
        :loading="store.isSubmitting"
        :disable="store.isSubmitting"
        @click="submitReport"
      />
    </q-footer>

    <!-- Dialog: เพิ่มรายละเอียดงาน -->
    <q-dialog v-model="workDialog" position="bottom">
      <q-card style="width: 100vw; border-radius: 20px 20px 0 0; padding-bottom: 20px;">
        <q-card-section class="bg-primary text-white row items-center q-pb-sm">
          <q-icon name="assignment" size="24px" class="q-mr-sm" />
          <div class="text-h6 text-weight-bold" style="font-size: 18px;">เพิ่มรายละเอียดงาน</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>
        
        <q-card-section class="q-pt-md column q-gutter-y-md">
          <q-input 
            outlined 
            v-model="newWork.name" 
            autofocus 
            label="รายละเอียดงานที่ปฏิบัติ" 
            placeholder="เช่น เทปูน, ทาสี" 
            bg-color="white" 
            hide-bottom-space 
          />
          
          <div class="row q-col-gutter-sm">
            <div class="col-12 col-sm-6">
              <q-select outlined v-model="newWork.location" :options="roomOptions" label="พิกัด / ห้อง" bg-color="white" />
            </div>
            <div class="col-12 col-sm-6">
              <q-select outlined v-model="newWork.unit" :options="unitOptions" label="หน่วยของงาน" bg-color="white" />
            </div>
          </div>
          
          <q-input 
            outlined 
            type="number" 
            v-model.number="newWork.actual" 
            label="ทำได้จริง (%)" 
            placeholder="0 - 100"
            bg-color="white"
            suffix="%"
            hide-bottom-space
          />
        </q-card-section>
        
        <q-card-actions class="bg-white q-px-md q-pt-none column">
          <q-btn unelevated label="บันทึกข้อมูล" color="primary" @click="saveWork" class="full-width text-weight-bold q-mb-sm" style="border-radius: 8px; height: 48px; font-size: 16px;" />
          <q-btn flat label="ยกเลิก" color="grey-8" v-close-popup class="full-width text-weight-medium" style="border-radius: 8px; height: 48px; font-size: 16px;" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialog: เพิ่มบุคลากร/คนงาน -->
    <q-dialog v-model="personDialog" position="bottom">
      <q-card style="width: 100vw; border-radius: 20px 20px 0 0; padding-bottom: 20px;">
        <q-card-section :class="isWorker ? 'bg-orange-8 text-white' : 'bg-blue-8 text-white'">
          <div class="row items-center">
            <div class="text-h6">{{ isWorker ? 'เพิ่มคนงาน' : 'เพิ่มบุคลากร' }}</div>
            <q-space />
            <q-btn icon="close" flat round dense v-close-popup />
          </div>
        </q-card-section>
        <q-card-section class="q-pt-md column q-gutter-y-md">
          <q-select 
            outlined 
            v-model="newPerson.name" 
            :options="isWorker ? workerOptions : personnelOptions" 
            :label="isWorker ? 'ประเภทคนงาน / ทีม' : 'ตำแหน่งบุคลากร'" 
            autofocus 
          />
          <div class="row items-center justify-between q-mt-sm">
            <span class="text-subtitle1 text-grey-8 text-weight-bold">จำนวนคน</span>
            <div class="row items-center q-gutter-x-sm">
              <q-btn round flat color="negative" icon="remove_circle" size="lg" @click="newPerson.count > 1 ? newPerson.count-- : 1" />
              <q-input outlined type="number" v-model.number="newPerson.count" input-class="text-center text-weight-bold text-h6" style="width: 80px;" />
              <q-btn round flat :color="isWorker ? 'orange-8' : 'blue-8'" icon="add_circle" size="lg" @click="newPerson.count++" />
            </div>
          </div>
          <div class="row items-center justify-between q-mt-sm">
            <span class="text-subtitle1 text-grey-8 text-weight-bold">เวลาทำงาน (ชม./คน)</span>
            <div class="row items-center q-gutter-x-sm">
              <q-btn round flat color="negative" icon="remove_circle" size="lg" @click="newPerson.hours = Math.max(0, (newPerson.hours || 0) - 1)" />
              <q-input outlined type="number" v-model.number="newPerson.hours" input-class="text-center text-weight-bold text-h6" style="width: 80px;" />
              <q-btn round flat :color="isWorker ? 'orange-8' : 'blue-8'" icon="add_circle" size="lg" @click="newPerson.hours = (newPerson.hours || 0) + 1" />
            </div>
          </div>
        </q-card-section>
        <q-card-actions class="bg-white q-px-md q-pt-none column">
          <q-btn unelevated label="บันทึกข้อมูล" :color="isWorker ? 'orange-8' : 'blue-8'" @click="savePerson" class="full-width text-weight-bold q-mb-sm" style="border-radius: 8px; height: 48px; font-size: 16px;" />
          <q-btn flat label="ยกเลิก" color="grey-8" v-close-popup class="full-width text-weight-medium" style="border-radius: 8px; height: 48px; font-size: 16px;" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialog: เพิ่มรายงานเพิ่มเติม -->
    <q-dialog v-model="noteDialog" position="bottom">
      <q-card style="width: 100vw; border-radius: 20px 20px 0 0; padding-bottom: 20px;">
        <q-card-section class="bg-negative text-white">
          <div class="row items-center">
            <div class="text-h6">รายงานเพิ่มเติม / ปัญหา</div>
            <q-space />
            <q-btn icon="close" flat round dense v-close-popup />
          </div>
        </q-card-section>
        <q-card-section class="q-pt-md column q-gutter-y-md">
          <q-input outlined v-model="newNote.text" type="textarea" rows="3" label="รายละเอียดปัญหา หรือข้อเสนอแนะ" autofocus />
          <div class="text-caption text-grey-8 q-mb-xs">สถานะ/หมวดหมู่</div>
          <q-btn-toggle
            v-model="newNote.status"
            spread
            no-caps
            rounded
            unelevated
            toggle-color="negative"
            color="white"
            text-color="grey-8"
            :options="[
              { label: 'ติดตามผล', value: 'ติดตามผล' },
              { label: 'รอดำเนินการ', value: 'รอดำเนินการ' },
              { label: 'รับทราบแล้ว', value: 'รับทราบแล้ว' },
            ]"
            style="border: 1px solid #e0e0e0; border-radius: 8px;"
          />
        </q-card-section>
        <q-card-actions class="bg-white q-px-md q-pt-none column">
          <q-btn unelevated label="บันทึกข้อมูล" color="negative" @click="saveNote" class="full-width text-weight-bold q-mb-sm" style="border-radius: 8px; height: 48px; font-size: 16px;" />
          <q-btn flat label="ยกเลิก" color="grey-8" v-close-popup class="full-width text-weight-medium" style="border-radius: 8px; height: 48px; font-size: 16px;" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialog: เพิ่มเครื่องจักร -->
    <q-dialog v-model="machineDialog" position="bottom">
      <q-card style="width: 100vw; border-radius: 20px 20px 0 0; padding-bottom: 20px;">
        <q-card-section class="bg-teal-8 text-white">
          <div class="row items-center">
            <div class="text-h6">เพิ่มเครื่องจักร/อุปกรณ์</div>
            <q-space />
            <q-btn icon="close" flat round dense v-close-popup />
          </div>
        </q-card-section>
        <q-card-section class="q-pt-md column q-gutter-y-md">
          <q-input outlined v-model="newMachine.name" label="ชื่อ/ประเภทเครื่องจักร" placeholder="เช่น รถแบ็คโฮ, รถเครน" autofocus />
          <q-input outlined v-model="newMachine.size" label="ขนาดเครื่องจักร" placeholder="เช่น PC200, 50T" />
          <div class="row items-center justify-between q-mt-sm">
            <span class="text-subtitle1 text-grey-8 text-weight-bold">จำนวน (คัน)</span>
            <div class="row items-center q-gutter-x-sm">
              <q-btn round flat color="negative" icon="remove_circle" size="lg" @click="newMachine.quantity > 1 ? newMachine.quantity-- : 1" />
              <q-input outlined type="number" v-model.number="newMachine.quantity" input-class="text-center text-weight-bold text-h6" style="width: 80px;" />
              <q-btn round flat color="teal-8" icon="add_circle" size="lg" @click="newMachine.quantity++" />
            </div>
          </div>
          <div class="row items-center justify-between q-mt-sm">
            <span class="text-subtitle1 text-grey-8 text-weight-bold">เวลาทำงาน (ชม.)</span>
            <div class="row items-center q-gutter-x-sm">
              <q-btn round flat color="negative" icon="remove_circle" size="lg" @click="newMachine.hours = Math.max(0, (newMachine.hours || 0) - 1)" />
              <q-input outlined type="number" v-model.number="newMachine.hours" input-class="text-center text-weight-bold text-h6" style="width: 80px;" />
              <q-btn round flat color="teal-8" icon="add_circle" size="lg" @click="newMachine.hours = (newMachine.hours || 0) + 1" />
            </div>
          </div>
        </q-card-section>
        <q-card-actions class="bg-white q-px-md q-pt-none column">
          <q-btn unelevated label="บันทึกข้อมูล" color="teal-8" @click="saveMachine" class="full-width text-weight-bold q-mb-sm" style="border-radius: 8px; height: 48px; font-size: 16px;" />
          <q-btn flat label="ยกเลิก" color="grey-8" v-close-popup class="full-width text-weight-medium" style="border-radius: 8px; height: 48px; font-size: 16px;" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialog: เพิ่มรายงานอุบัติเหตุ -->
    <q-dialog v-model="accidentDialog" position="bottom">
      <q-card style="width: 100vw; border-radius: 20px 20px 0 0; padding-bottom: 20px;">
        <q-card-section class="bg-red-8 text-white">
          <div class="row items-center">
            <div class="text-h6">รายงานผู้บาดเจ็บ/อุบัติเหตุ</div>
            <q-space />
            <q-btn icon="close" flat round dense v-close-popup />
          </div>
        </q-card-section>
        <q-card-section class="q-pt-md column q-gutter-y-md">
          <div class="row items-center justify-between">
            <span class="text-subtitle1 text-grey-8 text-weight-bold">จำนวนคนบาดเจ็บ/อุบัติเหตุ</span>
            <div class="row items-center q-gutter-x-sm">
              <q-btn round flat color="negative" icon="remove_circle" size="lg" @click="newAccident.count > 1 ? newAccident.count-- : 1" />
              <q-input outlined type="number" v-model.number="newAccident.count" input-class="text-center text-weight-bold text-h6" style="width: 80px;" />
              <q-btn round flat color="red-8" icon="add_circle" size="lg" @click="newAccident.count++" />
            </div>
          </div>
        </q-card-section>
        <q-card-actions class="bg-white q-px-md q-pt-none column">
          <q-btn unelevated label="บันทึกข้อมูล" color="red-8" @click="saveAccident" class="full-width text-weight-bold q-mb-sm" style="border-radius: 8px; height: 48px; font-size: 16px;" />
          <q-btn flat label="ยกเลิก" color="grey-8" v-close-popup class="full-width text-weight-medium" style="border-radius: 8px; height: 48px; font-size: 16px;" />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-layout>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import { useConstructionDailyReportStore } from 'src/stores/useConstructionDailyReport';
import type { ConstructionDailyReportPayload, MachinePayload, PersonnelPayload } from 'src/stores/useConstructionDailyReport';

const $q = useQuasar();
const router = useRouter();
const route = useRoute();
const store = useConstructionDailyReportStore();

const API_BASE_URL = import.meta.env.VITE_API_URL as string;

async function urlToFile(url: string, filename: string): Promise<File | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type || 'image/jpeg' });
  } catch (err) {
    console.error('Failed to load image as file:', url, err);
    return null;
  }
}

// roundId จาก route params (เช่น /inspector/job/:roundId/construction-inspect)
const roundId = Number(route.params.roundId);

onMounted(async () => {
  if (!roundId) return;
  const existingReport = await store.fetchReportByRound(roundId);
  if (existingReport) {
    if (existingReport.workingPeriod) {
      const [start, end] = existingReport.workingPeriod.split(' - ');
      if (start) form.value.startTime = start.trim();
      if (end) form.value.endTime = end.trim();
    }
    if (existingReport.weather) {
      form.value.weather = existingReport.weather;
    }
    
    if (existingReport.workItems && existingReport.workItems.length > 0) {
      workDetails.value = existingReport.workItems.map(item => ({
        id: Date.now() + Math.random(),
        name: item.description,
        location: item.location || '',
        unit: item.unit || '',
        actual: item.actualPercent || 0,
      }));
    }
    
    if (existingReport.personnels && existingReport.personnels.length > 0) {
      personnelList.value = existingReport.personnels
        .filter(p => p.type === 'PERSONNEL')
        .map(p => ({
          id: Date.now() + Math.random(),
          name: p.name,
          count: p.count,
          hours: p.hours ?? null,
        }));
      workerList.value = existingReport.personnels
        .filter(p => p.type === 'WORKER')
        .map(p => ({
          id: Date.now() + Math.random(),
          name: p.name,
          count: p.count,
          hours: p.hours ?? null,
        }));
    }
    
    if (existingReport.issues && existingReport.issues.length > 0) {
      notesList.value = existingReport.issues.map(issue => ({
        id: Date.now() + Math.random(),
        text: issue.description,
        status: issue.note || 'ติดตามผล',
      }));
    }
    
    if (existingReport.machines && existingReport.machines.length > 0) {
      machineList.value = existingReport.machines.map(m => ({
        id: Date.now() + Math.random(),
        name: m.machineName,
        size: m.machineSize || '',
        quantity: m.quantity || 1,
        hours: m.workingHours ?? null,
      }));
    }
    
    if (existingReport.accidents && existingReport.accidents.length > 0) {
      accidentList.value = existingReport.accidents.map(a => ({
        id: Date.now() + Math.random(),
        count: a.accidentCount || 1,
      }));
    }

    if (existingReport.images && existingReport.images.length > 0) {
      for (const img of existingReport.images) {
        const fullUrl = img.imageUrl.startsWith('http') ? img.imageUrl : `${API_BASE_URL}${img.imageUrl}`;
        const filename = img.imageUrl.split('/').pop() || 'image.jpg';
        const file = await urlToFile(fullUrl, filename);
        
        if (file) {
          if (img.imageType === 'PANORAMA') {
            panoramaFile.value = file;
            panoramaPreview.value = URL.createObjectURL(file);
          } else if (img.imageType === 'WORK_DETAIL' || img.imageType === 'GENERAL') {
            photos.value.push({
              id: Date.now().toString() + Math.random(),
              file: file,
              preview: URL.createObjectURL(file),
              workDetailName: img.caption || null
            });
          }
        }
      }
    }
  }
});

// สำหรับ Panorama View
const panoramaInput = ref<HTMLInputElement | null>(null);
const panoramaFile = ref<File | null>(null);
const panoramaPreview = ref<string | null>(null);

const triggerPanoramaInput = () => {
  panoramaInput.value?.click();
};

const onPanoramaUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (!target.files || target.files.length === 0) return;
  const file = target.files[0];
  if (!file) return;
  if (panoramaPreview.value) {
    URL.revokeObjectURL(panoramaPreview.value);
  }
  panoramaFile.value = file;
  panoramaPreview.value = URL.createObjectURL(file);
};

const removePanorama = () => {
  if (panoramaPreview.value) {
    URL.revokeObjectURL(panoramaPreview.value);
  }
  panoramaFile.value = null;
  panoramaPreview.value = null;
  if (panoramaInput.value) panoramaInput.value.value = '';
};

// 1. General Info
const form = ref({
  startTime: '',
  endTime: '',
  weather: 'Sunny',
});

const setCurrentTime = (field: 'startTime' | 'endTime') => {
  const now = new Date();
  const hh = now.getHours().toString().padStart(2, '0');
  const mm = now.getMinutes().toString().padStart(2, '0');
  form.value[field] = `${hh}:${mm}`;
};

// 2. Work Details
const roomOptions = ['ห้องรับแขก', 'ห้องนอน', 'ห้องน้ำ', 'ห้องครัว', 'ระเบียง', 'รอบตัวบ้าน', 'หลังคา', 'ส่วนกลาง'];
const unitOptions = ['ตร.ม.', 'เมตร', 'ชิ้น', 'จุด', 'ชุด'];
const workDetails = ref<{id: number, name: string, location: string, unit: string, actual: number}[]>([]);
const workDialog = ref(false);
const newWork = ref({ name: '', location: '', unit: '', actual: 0 });

// Image Upload State
interface WorkPhoto {
  id: string;
  file: File;
  preview: string;
  workDetailName: string | null;
}
const photos = ref<WorkPhoto[]>([]);

interface GridItem {
  type: 'photo' | 'add_button' | 'empty';
  photo?: WorkPhoto;
  workName?: string | null;
}

const gridItems = computed<GridItem[]>(() => {
  const items: GridItem[] = [];
  
  // 1. ใส่รูปและปุ่มเพิ่มรูป ของแต่ละงาน (1 งาน = 1 รูป)
  for (const work of workDetails.value) {
    const workPhoto = photos.value.find(p => p.workDetailName === work.name);
    
    if (workPhoto) {
      items.push({ type: 'photo', photo: workPhoto, workName: work.name });
    } else {
      items.push({ type: 'add_button', workName: work.name });
    }
  }

  // 2. เติมช่องว่างให้ครบ 6 ช่อง (ถ้ามีน้อยกว่า 6)
  while (items.length < 6) {
    items.push({ type: 'empty' });
  }

  return items;
});

const fileInput = ref<HTMLInputElement | null>(null);
const targetWorkDetailForPhoto = ref<string | null>(null);

const triggerFileInput = (workName?: string) => {
  if (typeof workName === 'string') {
    targetWorkDetailForPhoto.value = workName;
  } else {
    targetWorkDetailForPhoto.value = null;
  }
  fileInput.value?.click();
};

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    Array.from(target.files).forEach(file => {
      let preview = '';
      if (typeof window !== 'undefined' && window.URL) {
        preview = window.URL.createObjectURL(file);
      }
      photos.value.push({
        id: Date.now().toString() + Math.floor(Math.random() * 1000).toString(),
        file,
        preview,
        workDetailName: targetWorkDetailForPhoto.value
      });
    });
  }
  targetWorkDetailForPhoto.value = null;
  if (target) target.value = '';
};

const removePhoto = (id: string) => {
  const index = photos.value.findIndex(p => p.id === id);
  if (index !== -1) {
    const photo = photos.value[index];
    if (photo && typeof window !== 'undefined' && window.URL && photo.preview) {
      window.URL.revokeObjectURL(photo.preview);
    }
    photos.value.splice(index, 1);
  }
};

// ป้องกัน Memory Leak
onUnmounted(() => {
  if (typeof window !== 'undefined' && window.URL) {
    photos.value.forEach(p => {
      if (p.preview) window.URL.revokeObjectURL(p.preview);
    });
  } // close if (typeof window !== 'undefined')
  if (panoramaPreview.value) {
    if (typeof window !== 'undefined' && window.URL) {
      window.URL.revokeObjectURL(panoramaPreview.value);
    }
  }
});

// Summaries
const workSummary = computed(() => `รวม ${workDetails.value.length} รายการ`);
const personnelSummary = computed(() => {
  const count = personnelList.value.reduce((sum, p) => sum + p.count, 0);
  const hours = personnelList.value.reduce((sum, p) => sum + (p.hours || 0) * p.count, 0);
  return `รวม ${count} คน (${hours} ชม.)`;
});
const workerSummary = computed(() => {
  const count = workerList.value.reduce((sum, w) => sum + w.count, 0);
  const hours = workerList.value.reduce((sum, w) => sum + (w.hours || 0) * w.count, 0);
  return `รวม ${count} คน (${hours} ชม.)`;
});
const accidentSummary = computed(() => {
  const count = accidentList.value.reduce((sum, a) => sum + a.count, 0);
  return `รวม ${count} ราย`;
});

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
const personnelList = ref<{id: number, name: string, count: number, hours: number | null}[]>([]);
const workerList = ref<{id: number, name: string, count: number, hours: number | null}[]>([]);
const personDialog = ref(false);
const isWorker = ref(false);
const newPerson = ref({ name: '', count: 1, hours: null as number | null });

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
  newPerson.value = { name: '', count: 1, hours: 8 };
  personDialog.value = true;
};
const addWorker = () => {
  isWorker.value = true;
  newPerson.value = { name: '', count: 1, hours: 8 };
  personDialog.value = true;
};
const savePerson = () => {
  if (!newPerson.value.name) return $q.notify({ message: 'กรุณากรอกชื่อหรือตำแหน่ง', color: 'warning' });
  if (newPerson.value.count < 1) newPerson.value.count = 1;
  if (newPerson.value.hours !== null && newPerson.value.hours < 0) newPerson.value.hours = 0;
  
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

// 4. เครื่องจักร/อุปกรณ์
const machineList = ref<{id: number, name: string, size: string, quantity: number, hours: number | null}[]>([]);
const machineDialog = ref(false);
const newMachine = ref({ name: '', size: '', quantity: 1, hours: null as number | null });

const addMachine = () => {
  newMachine.value = { name: '', size: '', quantity: 1, hours: 8 };
  machineDialog.value = true;
};
const saveMachine = () => {
  if (!newMachine.value.name) return $q.notify({ message: 'กรุณากรอกชื่อ/ประเภทเครื่องจักร', color: 'warning' });
  if (newMachine.value.quantity < 1) newMachine.value.quantity = 1;
  machineList.value.push({ id: Date.now(), ...newMachine.value });
  machineDialog.value = false;
};
const removeMachine = (id: number) => {
  machineList.value = machineList.value.filter(m => m.id !== id);
};

// 5. รายงานอุบัติเหตุ
const accidentList = ref<{id: number, count: number}[]>([]);
const accidentDialog = ref(false);
const newAccident = ref({ count: 1 });

const addAccident = () => {
  newAccident.value = { count: 1 };
  accidentDialog.value = true;
};
const saveAccident = () => {
  if (newAccident.value.count < 1) newAccident.value.count = 1;
  accidentList.value.push({ id: Date.now(), ...newAccident.value });
  accidentDialog.value = false;
};
const removeAccident = (id: number) => {
  accidentList.value = accidentList.value.filter(a => a.id !== id);
};

// 6. Additional Notes
const notesList = ref<{id: number, text: string, status: string}[]>([]);
const noteDialog = ref(false);
const newNote = ref({ text: '', status: 'ติดตามผล' });

const addAdditionalNote = () => {
  newNote.value = { text: '', status: 'ติดตามผล' };
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

// 7. Submit — แปลง form data เป็น API payload แล้วส่ง POST
const submitReport = async () => {
  // Validation
  if (!form.value.startTime || !form.value.endTime) {
    return $q.notify({
      message: 'กรุณาระบุเวลาเริ่มและเวลาจบให้ครบถ้วน',
      color: 'warning',
      icon: 'warning',
    });
  }
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!timeRegex.test(form.value.startTime) || !timeRegex.test(form.value.endTime)) {
    return $q.notify({
      message: 'รูปแบบเวลาไม่ถูกต้อง (00:00 - 23:59)',
      color: 'warning',
      icon: 'warning',
    });
  }
  if (!form.value.weather) {
    return $q.notify({
      message: 'กรุณาระบุสภาพอากาศ',
      color: 'warning',
      icon: 'warning',
    });
  }
  if (workDetails.value.length === 0) {
    return $q.notify({
      message: 'กรุณาเพิ่มรายละเอียดงานอย่างน้อย 1 งาน',
      color: 'warning',
      icon: 'warning',
    });
  }

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
      ...personnelList.value.map((p) => {
        const payload: PersonnelPayload = {
          name: p.name,
          type: 'PERSONNEL',
          count: p.count,
        };
        if (p.hours != null) payload.hours = p.hours;
        return payload;
      }),
      ...workerList.value.map((w) => {
        const payload: PersonnelPayload = {
          name: w.name,
          type: 'WORKER',
          count: w.count,
        };
        if (w.hours != null) payload.hours = w.hours;
        return payload;
      }),
    ],

    // แปลง notesList → issues
    issues: notesList.value.map((n) => ({
      description: n.text,
      note: n.status,
    })),

    // แปลง machineList → machines
    machines: machineList.value.map((m) => {
      const payload: MachinePayload = {
        machineName: m.name,
        quantity: m.quantity,
      };
      if (m.size) payload.machineSize = m.size;
      if (m.hours != null) payload.workingHours = m.hours;
      return payload;
    }),

    // แปลง accidentList → accidents
    accidents: accidentList.value.map((a) => ({
      description: 'เกิดอุบัติเหตุ/ผู้บาดเจ็บ',
      accidentCount: a.count,
    })),
  };

  if (form.value.weather) {
    payload.weather = form.value.weather;
  }

  if (form.value.startTime && form.value.endTime) {
    payload.workingPeriod = `${form.value.startTime} - ${form.value.endTime}`;
  }

  try {
    const formData = new FormData();
    formData.append('payload', JSON.stringify(payload));

    if (panoramaFile.value) {
      formData.append('panoramaFile', panoramaFile.value);
    }

    if (photos.value && photos.value.length > 0) {
      photos.value.forEach((photo) => {
        formData.append('photos', photo.file);
        formData.append('photoWorkDetailNames', photo.workDetailName || '');
      });
    }

    await store.submitReport(formData);
    $q.notify({
      message: route.path.includes('/admin') ? 'บันทึกการแก้ไขเรียบร้อยแล้ว' : 'ส่งรายงานประจำวันเรียบร้อยแล้ว',
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
