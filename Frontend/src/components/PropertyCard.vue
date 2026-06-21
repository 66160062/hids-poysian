<script setup lang="ts">
import { useRouter } from 'vue-router';

interface PropertyItem {
  roundId: number;
  status: string;
  roundNumber: string;
  job: {
    projectName: string;
    projectImageUrl?: string;
    inspectionType?: string;
    address?: {
      houseNumber?: string;
      soi?: string;
      subDistrict?: string;
      district?: string;
      province?: string;
      postalCode?: string;
      floor?: number | string;
    };
    houseType?: {
      name: string;
    };
    customer?: {
      fullName?: string;
      phoneNumber?: string;
    };
  };
}

// 🎯 เปลี่ยนเป็นประกาศตัวแปร props เพื่อให้เรียกใช้ข้อมูลข้างในฟังก์ชันได้
const props = defineProps<{
  item: PropertyItem;
  isMobile: boolean;
}>();

const router = useRouter();

const goToInspectionInfo = (roundId: number) => {
  void router.push(`/inspector/job/${roundId}`);
};

// 🎯 ฟังก์ชันสำหรับเปิด Google Maps พร้อมคำค้นหา
const openGoogleMaps = () => {
  if (!props.item?.job) return;

  const job = props.item.job;
  const address = job.address;

  // รวมข้อมูลที่อยู่ทั้งหมดเพื่อใช้ค้นหา
  const searchQueryParts = [
    job.projectName,
    address?.houseNumber ? `เลขที่ ${address.houseNumber}` : '',
    address?.soi ? `ถ.${address.soi}` : '',
    address?.subDistrict ? `ต.${address.subDistrict}` : '',
    address?.district ? `อ.${address.district}` : '',
    address?.province ? `จ.${address.province}` : '',
    address?.postalCode || '',
  ];

  // กรองค่าว่างทิ้ง แล้วต่อเป็นข้อความเดียวด้วยช่องว่าง
  const searchQuery = searchQueryParts.filter((part) => part).join(' ');

  if (searchQuery.trim()) {
    // แปลงข้อความให้รองรับ URL (รองรับภาษาไทย)
    const encodedQuery = encodeURIComponent(searchQuery);

    // ลิงก์มาตรฐานของ Google Maps Search
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`;

    // เปิดแท็บใหม่ (หรือเปิดแอป Maps บนมือถือ)
    window.open(mapsUrl, '_blank');
  } else {
    alert('ไม่พบข้อมูลที่อยู่สำหรับนำทาง');
  }
};

const apiUrl = import.meta.env.VITE_API_URL;

const isDefect = (type?: string) => type === 'DEFECT_INSPECTION' || type === 'Defect' || type === 'ตรวจ Defect';
const isConstruction = (type?: string) => type === 'CONSTRUCTION_INSPECTION' || type === 'Construction' || type === 'ตรวจก่อสร้าง';
</script>

<template>
  <q-card v-if="item && item.job" flat bordered class="q-mb-md property-card q-mx-auto cursor-pointer" @click="goToInspectionInfo(item.roundId)" v-ripple>
    <q-card-section class="row no-wrap items-stretch" style="padding: 16px">
      <div class="col-auto column" style="padding-right: 16px">
        <q-img loading="eager"
          :src="
            item.job.projectImageUrl
              ? `${apiUrl}${item.job.projectImageUrl}`
              : 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=300'
          "
          class="col"
          :style="{ width: isMobile ? '110px' : '150px', borderRadius: '8px' }"
          fit="cover"
        />
      </div>

      <div class="col column justify-between min-w-0">
        <div class="row items-start justify-between no-wrap q-mb-xs">
          <div class="column col q-pr-sm">
            <div
              class="text-primary ellipsis"
              style="
                font-weight: 500;
                font-size: 14px;
                line-height: 1.2;
              "
            >
              {{ item.job.projectName }}
            </div>
            <!-- Inspection Type Badge -->
            <div class="q-mt-xs">
              <q-badge
                v-if="isDefect(item.job?.inspectionType)"
                color="primary"
                outline
                label="การตรวจบ้าน"
                class="q-px-sm"
                style="font-size: 10px; font-weight: 500; border-radius: 4px;"
              />
              <q-badge
                v-else-if="isConstruction(item.job?.inspectionType)"
                color="warning"
                outline
                label="การตรวจก่อสร้าง"
                class="q-px-sm"
                style="font-size: 10px; font-weight: 500; border-radius: 4px;"
              />
            </div>
          </div>

          <q-badge
            color="warning"
            text-color="black"
            style="
              width: 53px;
              height: 15px;
              min-height: 15px;
              padding: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              border-radius: 99px;
              font-weight: 500;
              font-size: 8px;
            "
          >
            <div v-if="item.status == 'SCHEDULED'">รอเข้าตรวจ</div>
            <div v-else-if="item.status === 'SUBMITTED'">รอการอนุมัติ</div>
          </q-badge>
        </div>

        <div
          class="text-grey-7"
          style="
            font-weight: 300;
            font-style: italic;
            font-size: 8px;
            line-height: 1.3;
            display: -webkit-box;
            -webkit-box-orient: vertical;
            overflow: hidden;
          "
        >
          เลขที่ {{ item.job.address?.houseNumber || '-' }} ถ.{{
            item.job.address?.soi || '-'
          }}
          ต.{{ item.job.address?.subDistrict || '-' }} อ.{{
            item.job.address?.district || '-'
          }}
          จ.{{ item.job.address?.province || '-' }} {{ item.job.address?.postalCode || '-' }}
        </div>

        <div
          class="q-mt-xs text-dark"
          style="font-weight: 500; font-size: 10px"
        >
          <span class="text-primary">ประเภทที่อยู่:</span>
          <span>
            {{ item.job.houseType?.name }}
            {{ item.job.address?.floor ? item.job.address.floor + ' ชั้น' : '' }}</span
          >
        </div>

        <div class="q-mt-xs">
          <div class="row items-center q-gutter-x-xs">
            <q-icon name="person_outline" color="primary" size="14px" />
            <span
              class="text-primary"
              style="font-weight: 500; font-size: 12px"
            >
              {{ item.job.customer?.fullName || 'ไม่ระบุชื่อ' }}
            </span>
          </div>
          <div class="row items-center q-gutter-x-xs q-mt-xs">
            <q-icon name="phone_in_talk" color="primary" size="14px" />
            <span
              class="text-dark"
              style="font-weight: 500; font-size: 12px"
            >
              {{ item.job.customer?.phoneNumber || 'ไม่ระบุเบอร์โทร' }}
            </span>
          </div>
        </div>

        <div class="row items-center justify-between q-mt-sm">
          <q-btn
            unelevated
            color="primary"
            icon="map"
            label="นำทาง"
            size="sm"
            class="nav-button"
            style="font-size: 12px; font-weight: 500"
            no-caps
            @click.stop="openGoogleMaps"
          />
          <q-icon
            name="chevron_right"
            color="primary"
            size="28px"
            class="q-mr-xs"
          />
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<style scoped>
.property-card {
  font-family: 'Inter', 'Noto Sans Thai', -apple-system, BlinkMacSystemFont, sans-serif;
  width: 100%;
  min-height: 150px;
  height: auto;
  border-radius: 15px;
  border: 1px solid #1975d2;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  margin: 0 auto;
}

.nav-button {
  border-radius: 8px;
  padding: 4px 12px;
  width: 110px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.min-w-0 {
  min-width: 0;
}
</style>
