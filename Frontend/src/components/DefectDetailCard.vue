<template>
  <q-card flat bordered class="rounded-borders bg-white q-pa-sm">
    <div class="row no-wrap q-gutter-x-md">
      <div class="image-wrapper">
        <q-img
          :src="`http://localhost:3000${defect.imageUrl}`"
          class="defect-img rounded-borders"
          spinner-color="primary"
        />
        <div class="location-badge">
          {{ defect.locationLabel }}
        </div>
      </div>

      <div class="col column justify-between">
        <div>
          <div class="row justify-between items-center">
            <div class="text-caption text-grey-7" style="font-size: 10px">ประเภทงาน</div>
            <q-badge
              :color="severityColor(defect.severity)"
              rounded
              class="q-px-sm text-weight-bold"
            >
              {{ defect.severity }}
            </q-badge>
          </div>
          <div class="text-subtitle2 text-weight-bold text-black">{{ defect.category }}</div>
        </div>

        <div class="q-mt-xs">
          <div class="text-caption text-grey-7 q-mb-xs" style="font-size: 10px">รายการ</div>
          <div class="row q-gutter-xs">
            <q-chip
              v-for="(tag, index) in defect.tags"
              :key="index"
              outline
              color="primary"
              class="bg-blue-1 text-weight-medium q-ma-none"
              size="sm"
            >
              {{ tag }}
            </q-chip>
          </div>
        </div>

        <!-- หมายเหตุ -->
        <div v-if="defect.description" class="q-mt-xs">
          <div class="text-caption text-grey-7 q-mb-xs" style="font-size: 10px">หมายเหตุ</div>
          <div class="text-caption text-grey-8">{{ defect.description }}</div>
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
      tags: [],
      description: '',
    }),
  },
});

function severityColor(severity: string): string {
  const map: Record<string, string> = {
    Critical: 'red',
    Major: 'deep-orange',
    Minor: 'amber-8',
  };
  return map[severity] ?? 'grey';
}
</script>

<style scoped>
.rounded-borders {
  border-radius: 8px;
}

.image-wrapper {
  position: relative;
  width: 130px;
  height: 130px;
  align-self: stretch;
  flex-shrink: 0;
}

.defect-img {
  width: 100%;
  height: 100%;
  min-height: 120px;
  object-fit: cover;
}

.location-badge {
  position: absolute;
  bottom: 0;
  left: 0; /* ← เปลี่ยนจาก right เป็น left+right เพื่อให้เต็มความกว้าง */
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.55), transparent); /* ← gradient แทนสีทึบ */
  color: #fff; /* ← เปลี่ยนสีตัวอักษรเป็นขาว */
  font-size: 10px;
  padding: 16px 6px 4px; /* ← padding บนเพื่อให้ gradient สวย */
  border-radius: 0 0 0 8px; /* ← ลบ border-top-left-radius ออก เหลือแค่มุมล่างซ้าย */
}
</style>
