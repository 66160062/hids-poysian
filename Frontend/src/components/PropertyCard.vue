<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useLocalizedField } from 'src/composables/useLocalizedField';
import { buildGoogleMapsUrl, parseCoordinate } from 'src/composables/useMapLocation';

interface PropertyItem {
  roundId: number;
  status: string;
  roundNumber: string;
  job: {
    projectName: string;
    projectNameEn?: string | null;
    projectImageUrl?: string;
    locationCoordinate?: string | null;
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
      nameEn?: string | null;
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
const { t } = useI18n();
const { pickLocalized } = useLocalizedField();

const goToInspectionInfo = (roundId: number) => {
  void router.push(`/inspector/job/${roundId}`);
};

// 🎯 ฟังก์ชันสำหรับเปิด Google Maps พร้อมคำค้นหา
const openGoogleMaps = () => {
  if (!props.item?.job) return;

  const job = props.item.job;
  const address = job.address;

  // ถ้า admin ปักหมุดไว้ ให้ไปที่พิกัดนั้นตรงๆ
  const pinned = parseCoordinate(job.locationCoordinate);
  if (pinned) {
    window.open(buildGoogleMapsUrl(pinned), '_blank');
    return;
  }

  // รวมข้อมูลที่อยู่ทั้งหมดเพื่อใช้ค้นหา
  const searchQueryParts = [
    job.projectName,
    address?.houseNumber
      ? `${t('components.propertyCard.houseNoPrefix')} ${address.houseNumber}`
      : '',
    address?.soi ? `${t('components.propertyCard.soiPrefix')}${address.soi}` : '',
    address?.subDistrict
      ? `${t('components.propertyCard.subDistrictPrefix')}${address.subDistrict}`
      : '',
    address?.district
      ? `${t('components.propertyCard.districtPrefix')}${address.district}`
      : '',
    address?.province
      ? `${t('components.propertyCard.provincePrefix')}${address.province}`
      : '',
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
    alert(t('components.propertyCard.noAddressForNavigation'));
  }
};

const apiUrl = import.meta.env.VITE_API_URL;

const getImageUrl = (url?: string) => {
  if (!url) return '';
  return url.startsWith('http') || url.startsWith('blob:') ? url : `${apiUrl}${url}`;
};

const isDefect = (type?: string) => type === 'DEFECT_INSPECTION' || type === 'Defect' || type === 'ตรวจ Defect';
const isConstruction = (type?: string) => type === 'CONSTRUCTION_INSPECTION' || type === 'Construction' || type === 'ตรวจก่อสร้าง';

// pastel bg + saturated text style — เหมือน status badge ในการ์ดหน้า AdminWorkListPage
const statusBadgeStyles: Record<string, { bgClass: string; textColor: string }> = {
  SCHEDULED: { bgClass: 'bg-blue-1', textColor: 'blue-9' },
  INSPECTED: { bgClass: 'bg-orange-1', textColor: 'orange-8' },
  SUBMITTED: { bgClass: 'bg-deep-orange-1', textColor: 'deep-orange-9' },
  APPROVED: { bgClass: 'bg-green-1', textColor: 'green-9' },
  COMPLETED: { bgClass: 'bg-green-1', textColor: 'green-9' },
  CANCELLED: { bgClass: 'bg-red-1', textColor: 'red-9' },
};

const statusBadgeStyle = (status: string) => statusBadgeStyles[status] ?? { bgClass: 'bg-grey-3', textColor: 'grey-8' };
</script>

<template>
  <q-card v-if="item && item.job" flat bordered class="q-mb-md property-card q-mx-auto cursor-pointer" @click="goToInspectionInfo(item.roundId)" v-ripple>
    <q-card-section class="row no-wrap items-stretch" style="padding: 16px">
      <div class="col-auto column" style="padding-right: 16px">
        <q-img loading="eager"
          :src="
            item.job.projectImageUrl
              ? getImageUrl(item.job.projectImageUrl)
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
              {{ pickLocalized(item.job.projectName, item.job.projectNameEn) }}
            </div>
            <!-- Inspection Type Badge -->
            <div class="q-mt-xs">
              <q-badge
                v-if="isDefect(item.job?.inspectionType)"
                color="primary"
                outline
                :label="t('components.propertyCard.inspectionTypeDefect')"
                class="q-px-sm"
                style="font-size: 10px; font-weight: 500; border-radius: 4px;"
              />
              <q-badge
                v-else-if="isConstruction(item.job?.inspectionType)"
                color="warning"
                outline
                :label="t('components.propertyCard.inspectionTypeConstruction')"
                class="q-px-sm"
                style="font-size: 10px; font-weight: 500; border-radius: 4px;"
              />
            </div>
          </div>

          <q-badge
            class="status-badge"
            :class="[statusBadgeStyle(item.status).bgClass, `text-${statusBadgeStyle(item.status).textColor}`]"
          >
            <div v-if="item.status == 'SCHEDULED'">{{ t('components.propertyCard.statusScheduled') }}</div>
            <div v-else-if="item.status === 'INSPECTED'">{{ t('components.propertyCard.statusInspected') }}</div>
            <div v-else-if="item.status === 'SUBMITTED'">{{ t('components.propertyCard.statusSubmitted') }}</div>
            <div v-else-if="item.status === 'APPROVED' || item.status === 'COMPLETED'">{{ t('components.propertyCard.statusCompleted') }}</div>
            <div v-else-if="item.status === 'CANCELLED'">{{ t('components.propertyCard.statusCancelled') }}</div>
            <div v-else>{{ t('components.propertyCard.statusUnknown') }}</div>
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
          {{ t('components.propertyCard.houseNoPrefix') }} {{ item.job.address?.houseNumber || '-' }} {{ t('components.propertyCard.soiPrefix') }}{{
            item.job.address?.soi || '-'
          }}
          {{ t('components.propertyCard.subDistrictPrefix') }}{{ item.job.address?.subDistrict || '-' }} {{ t('components.propertyCard.districtPrefix') }}{{
            item.job.address?.district || '-'
          }}
          {{ t('components.propertyCard.provincePrefix') }}{{ item.job.address?.province || '-' }} {{ item.job.address?.postalCode || '-' }}
        </div>

        <div
          class="q-mt-xs text-dark"
          style="font-weight: 500; font-size: 10px"
        >
          <span class="text-primary">{{ t('components.propertyCard.houseTypeLabel') }}</span>
          <span>
            {{ pickLocalized(item.job.houseType?.name, item.job.houseType?.nameEn) }}
            {{ item.job.address?.floor ? item.job.address.floor + ' ' + t('components.propertyCard.floorSuffix') : '' }}</span
          >
        </div>

        <div class="q-mt-xs">
          <div class="row items-center q-gutter-x-xs">
            <q-icon name="person_outline" color="primary" size="14px" />
            <span
              class="text-primary"
              style="font-weight: 500; font-size: 12px"
            >
              {{ item.job.customer?.fullName || t('components.propertyCard.unnamedCustomer') }}
            </span>
          </div>
          <div class="row items-center q-gutter-x-xs q-mt-xs">
            <q-icon name="phone_in_talk" color="primary" size="14px" />
            <span
              class="text-dark"
              style="font-weight: 500; font-size: 12px"
            >
              {{ item.job.customer?.phoneNumber || t('components.propertyCard.noPhoneNumber') }}
            </span>
          </div>
        </div>

        <div class="row items-center justify-between q-mt-sm">
          <q-btn
            unelevated
            color="primary"
            icon="map"
            :label="t('components.propertyCard.navigateButton')"
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
  border-radius: 16px;
  border: 1px solid #f0f0f0;
  margin: 0 auto;
}

.status-badge {
  font-weight: 700;
  font-size: 9px;
  padding: 3px 10px;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  letter-spacing: 0.2px;
  white-space: nowrap;
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
