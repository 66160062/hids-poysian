<template>
  <q-card flat bordered class="rounded-borders bg-white q-pa-sm">
    <div class="row no-wrap q-gutter-x-md">

      <div class="image-wrapper">
        <q-img :src="defect.imageUrl" class="defect-img rounded-borders" spinner-color="primary" />
        <div class="location-badge">
          {{ defect.locationLabel }}
        </div>
      </div>

      <div class="col column justify-between">

        <div>
          <div class="row justify-between items-center">
            <div class="text-caption text-grey-7" style="font-size: 10px;">ประเภทงาน</div>

            <q-badge :color="defect.severity === 'Major' ? 'red' : 'amber-8'" rounded class="q-px-sm text-weight-bold">
              {{ defect.severity }}
            </q-badge>
          </div>
          <div class="text-subtitle2 text-weight-bold text-black">{{ defect.category }}</div>
        </div>

        <div class="q-mt-xs">
          <div class="text-caption text-grey-7 q-mb-xs" style="font-size: 10px;">รายการ</div>
          <div class="row q-gutter-xs">
            <q-chip v-for="(tag, index) in defect.tags" :key="index" outline color="primary"
              class="bg-blue-1 text-weight-medium q-ma-none" size="sm">
              {{ tag }}
            </q-chip>
          </div>
        </div>

      </div>

    </div>
  </q-card>
</template>

<script setup lang="ts">
defineProps({
  defect: {
    type: Object,
    required: true,
    default: () => ({
      imageUrl: 'https://via.placeholder.com/150',
      locationLabel: 'ไม่ระบุตำแหน่ง',
      category: 'ไม่ระบุ',
      severity: 'Major',
      tags: []
    })
  }
})
</script>

<style scoped>
.rounded-borders {
  border-radius: 8px;
}

.image-wrapper {
  position: relative;
  width: 130px;
  height: 100px;
  flex-shrink: 0;
}

.defect-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.location-badge {
  position: absolute;
  bottom: 0;
  right: 0;
  background-color: rgba(224, 224, 224, 0.9);
  color: #424242;
  font-size: 10px;
  padding: 2px 6px;
  border-top-left-radius: 8px;
  border-bottom-right-radius: 8px;
}
</style>
