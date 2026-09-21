<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(val) => emit('update:modelValue', val)"
    @show="onShow"
    @hide="destroyMap"
  >
    <q-card class="map-picker-card">
      <q-card-section class="row items-center q-pb-sm">
        <q-icon name="location_on" color="primary" size="22px" class="q-mr-sm" />
        <div class="text-subtitle1 text-weight-bold text-primary">
          {{ t('components.mapPicker.title') }}
        </div>
        <q-space />
        <q-btn flat round dense icon="close" v-close-popup />
      </q-card-section>

      <q-card-section class="q-py-none">
        <q-input
          v-model="searchText"
          dense
          filled
          clearable
          :placeholder="t('components.mapPicker.searchPlaceholder')"
          @keyup.enter="() => runSearch()"
        >
          <template #append>
            <q-btn
              flat
              round
              dense
              icon="search"
              color="primary"
              :loading="searching"
              @click="() => runSearch()"
            />
          </template>
        </q-input>
        <div class="text-caption text-grey-7 q-mt-xs">{{ t('components.mapPicker.hint') }}</div>
      </q-card-section>

      <q-card-section class="q-pb-sm">
        <div ref="mapEl" class="map-container"></div>
      </q-card-section>

      <q-card-section class="q-pt-none text-caption text-grey-8">
        <template v-if="picked">
          {{ t('components.mapPicker.selected') }}: {{ formatCoordinate(picked) }}
        </template>
        <template v-else>{{ t('components.mapPicker.noPin') }}</template>
      </q-card-section>

      <q-card-actions align="right" class="q-px-md q-pb-md">
        <q-btn flat no-caps :label="t('components.mapPicker.cancel')" v-close-popup />
        <q-btn
          unelevated
          no-caps
          color="primary"
          :label="t('components.mapPicker.confirm')"
          :disable="!picked"
          :loading="resolving"
          @click="confirm"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import type { ThaiAddress } from '../composables/useThaiAddress';
import {
  formatCoordinate,
  reverseGeocode,
  searchPlace,
  toCoordinate,
  type Coordinate,
} from '../composables/useMapLocation';

const props = defineProps<{
  modelValue: boolean;
  // พิกัดที่ปักไว้ก่อนหน้า (ถ้ามี) จะแสดงหมุดและซูมเข้าที่จุดนั้น
  initialCoordinate?: Coordinate | null;
  // ข้อความที่อยู่ที่กรอกไว้แล้ว ใช้เลื่อนแผนที่ไปยังบริเวณใกล้เคียงตอนยังไม่เคยปัก
  searchQuery?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'confirm', payload: { coordinate: Coordinate; address: ThaiAddress | null }): void;
}>();

const $q = useQuasar();
const { t } = useI18n();

const DEFAULT_CENTER: L.LatLngTuple = [13.7563, 100.5018];

const mapEl = ref<HTMLDivElement | null>(null);
const searchText = ref('');
const searching = ref(false);
const resolving = ref(false);
const picked = ref<Coordinate | null>(null);

let map: L.Map | null = null;
let marker: L.Marker | null = null;

const defaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function setPin(latlng: L.LatLng) {
  if (!map) return;
  picked.value = { lat: latlng.lat, lng: latlng.lng };
  if (marker) {
    marker.setLatLng(latlng);
    return;
  }
  marker = L.marker(latlng, { draggable: true, icon: defaultIcon }).addTo(map);
  marker.on('dragend', () => {
    if (marker) setPin(marker.getLatLng());
  });
}

async function onShow() {
  await nextTick();
  if (!mapEl.value) return;

  const street = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors',
  });
  const satellite = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    { maxZoom: 19, attribution: 'Tiles &copy; Esri' },
  );

  const start = props.initialCoordinate;
  map = L.map(mapEl.value, {
    center: start ? [start.lat, start.lng] : DEFAULT_CENTER,
    zoom: start ? 18 : 6,
    layers: [street],
  });
  L.control
    .layers(
      {
        [t('components.mapPicker.layerMap')]: street,
        [t('components.mapPicker.layerSatellite')]: satellite,
      },
      undefined,
      { position: 'topright' },
    )
    .addTo(map);
  map.on('click', (e: L.LeafletMouseEvent) => setPin(e.latlng));

  picked.value = null;
  if (start) {
    setPin(L.latLng(start.lat, start.lng));
  }

  searchText.value = props.searchQuery ?? '';
  // Dialog เพิ่งเปิด ขนาด container อาจยังไม่นิ่ง
  setTimeout(() => map?.invalidateSize(), 100);
  if (!start && searchText.value.trim()) await runSearch(true);
}

function destroyMap() {
  map?.remove();
  map = null;
  marker = null;
  picked.value = null;
}

async function runSearch(silent?: boolean) {
  if (!map || !searchText.value?.trim()) return;
  searching.value = true;
  try {
    const found = await searchPlace(searchText.value);
    if (found) {
      map.setView([found.lat, found.lng], 17);
    } else if (silent !== true) {
      $q.notify({ type: 'warning', message: t('components.mapPicker.notFound'), position: 'top' });
    }
  } catch (error) {
    console.error('Map search failed:', error);
    if (silent !== true) {
      $q.notify({ type: 'negative', message: t('components.mapPicker.searchError'), position: 'top' });
    }
  } finally {
    searching.value = false;
  }
}

async function confirm() {
  const coordinate = picked.value && toCoordinate(picked.value.lat, picked.value.lng);
  if (!coordinate) return;
  resolving.value = true;
  let address: ThaiAddress | null = null;
  try {
    address = await reverseGeocode(coordinate);
  } catch (error) {
    // ดึงที่อยู่ไม่ได้ก็ยังบันทึกพิกัดได้ ให้ admin กรอกที่อยู่เอง
    console.error('Reverse geocoding failed:', error);
    $q.notify({ type: 'warning', message: t('components.mapPicker.addressLookupFailed'), position: 'top' });
  } finally {
    resolving.value = false;
  }
  emit('confirm', { coordinate, address });
  emit('update:modelValue', false);
}
</script>

<style scoped>
.map-picker-card {
  width: 640px;
  max-width: 95vw;
  border-radius: 16px;
}
.map-container {
  width: 100%;
  height: min(60vh, 420px);
  border-radius: 12px;
  overflow: hidden;
  z-index: 0;
}
</style>
