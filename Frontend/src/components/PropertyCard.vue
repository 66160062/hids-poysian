<script setup lang="ts">
import { useRouter } from 'vue-router';

interface InspectionItem {
  id: number;
  projectName: string;
  address: string;
  type: string;
  customer: string;
  phone: string;
  status: string;
  image: string;
}
defineProps<{
  item: InspectionItem;
  isMobile: boolean;
}>();

const router = useRouter();

const goToInspectionInfo = () => {
  void router.push('/inspectioninfo');
};
</script>

<template>
  <q-card v-if="item" flat bordered class="q-mb-md property-card q-mx-auto">
    <q-card-section class="row no-wrap items-stretch" style="padding: 16px">
      <div class="col-auto column" style="padding-right: 16px">
        <q-img
          :src="item.image"
          class="col"
          :style="{ width: isMobile ? '110px' : '150px', borderRadius: '8px' }"
          fit="cover"
        />
      </div>

      <div class="col column justify-between min-w-0">
        <div class="row items-start justify-between no-wrap q-mb-xs">
          <div
            class="text-primary ellipsis col q-pr-sm"
            style="
              font-family: 'Inter', sans-serif;
              font-weight: 500;
              font-size: 14px;
              line-height: 1.2;
            "
          >
            {{ item.projectName }}
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
              font-family: 'Inter', sans-serif;
              font-weight: 500;
              font-size: 8px;
            "
          >
            {{ item.status }}
          </q-badge>
        </div>

        <div
          class="text-grey-7"
          style="
            font-family: 'Inter', sans-serif;
            font-weight: 300;
            font-style: italic;
            font-size: 8px;
            line-height: 1.3;
            display: -webkit-box;
            -webkit-box-orient: vertical;
            overflow: hidden;
          "
        >
          {{ item.address }}
        </div>

        <div
          class="q-mt-xs text-dark"
          style="font-family: 'Inter', sans-serif; font-weight: 500; font-size: 10px"
        >
          <span class="text-primary">ประเภทที่อยู่:</span>
          <span> {{ item.type }}</span>
        </div>

        <div class="q-mt-xs">
          <div class="row items-center q-gutter-x-xs">
            <q-icon name="person_outline" color="primary" size="14px" />
            <span
              class="text-primary"
              style="font-family: 'Inter', sans-serif; font-weight: 500; font-size: 12px"
            >
              {{ item.customer }}
            </span>
          </div>
          <div class="row items-center q-gutter-x-xs q-mt-xs">
            <q-icon name="phone_in_talk" color="primary" size="14px" />
            <span
              class="text-dark"
              style="font-family: 'Inter', sans-serif; font-weight: 500; font-size: 12px"
            >
              {{ item.phone }}
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
            style="font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 500"
            no-caps
          />
          <q-btn flat round icon="chevron_right" color="primary" @click="goToInspectionInfo" />
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<style scoped>
.property-card {
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
