<template>
  <q-card flat bordered class="rounded-borders bg-white q-pa-sm cursor-pointer" @click="$emit('click')">
    <div class="row no-wrap q-gutter-x-md">
      <div class="image-wrapper">
        <q-img v-if="defect.imageUrl" loading="eager" :src="getImageUrl(defect.imageUrl) ?? undefined" class="defect-img rounded-borders" />
        <div v-else class="defect-img-placeholder row items-center justify-center bg-grey-2 rounded-borders defect-img">
          <q-icon name="image_not_supported" size="48px" color="grey-5" />
        </div>
        <div class="location-badge">{{ defect.locationLabel }}</div>
      </div>

      <div class="col column q-gutter-y-xs">
        <div>
          <div class="row justify-between items-start no-wrap">
            <div>
              <div class="text-caption text-grey-7" style="font-size: 10px">ประเภทงาน</div>
              <div class="text-subtitle2 text-weight-bold text-black">{{ defect.category }}</div>
            </div>

            <q-badge
              :color="statusInfo(defect.status).color"
              :text-color="statusInfo(defect.status).textColor"
              class="q-px-sm text-weight-bold"
              style="font-size: 10px; padding: 4px 8px"
            >
              {{ statusInfo(defect.status).label }}
            </q-badge>
          </div>
        </div>

        <div>
          <div class="text-caption text-grey-7 q-mb-xs" style="font-size: 10px">รายการ</div>
          <div class="row q-gutter-xs wrap">
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

        <div class="text-caption text-grey-7 q-mb-xs" style="font-size: 10px">หมายเหตุ</div>
        <div class="text-caption text-grey-8 line-clamp-2">{{ defect.description }}</div>

        <div class="row items-center q-gutter-x-sm">
          <div class="text-caption text-grey-7" style="font-size: 10px">ความรุนแรง:</div>
          <q-badge
            :color="severityColor(defect.severity)"
            rounded
            style="width: 8px; height: 8px; min-height: unset; padding: 0"
          />
          <div class="text-caption text-weight-medium">{{ defect.severity }}</div>
        </div>
      </div>
    </div>
  </q-card>
</template>

<script setup lang="ts">
const getImageUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  return path.startsWith('http') ? path : `${baseUrl}${path}`;
};
// เพิ่มฟังก์ชันสำหรับจัดการข้อมูลสถานะ
function statusInfo(status: string) {
  if (status === 'verified') {
    return { label: 'ผ่าน', color: 'green-1', textColor: 'green-9' };
  }
  return { label: 'ไม่ผ่าน', color: 'red-1', textColor: 'red-9' };
}

// severityColor (เหมือนเดิม)
function severityColor(severity: string): string {
  const map: Record<string, string> = {
    Critical: 'red',
    Major: 'deep-orange',
    Minor: 'amber-8',
  };
  return map[severity] ?? 'grey';
}

defineProps({
  defect: {
    type: Object,
    required: true,
  },
});

defineEmits(['click']);
</script>

<style scoped>
.rounded-borders {
  border-radius: 8px;
}

.image-wrapper {
  position: relative;
  width: 130px;
  height: 130px;
  flex-shrink: 0;
}

.defect-img {
  width: 100%;
  height: 100%;
  min-height: 130px;
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
  border-radius: 0 0 8px 8px;
}
</style>
