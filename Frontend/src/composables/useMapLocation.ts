import { useThaiAddress, type ThaiAddress } from './useThaiAddress';

export interface Coordinate {
  lat: number;
  lng: number;
}

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org';

// locationCoordinate ถูกเก็บเป็นสตริง "lat,lng" (ทศนิยม 6 หลัก ≈ แม่นระดับเซนติเมตร)
export function parseCoordinate(value?: string | null): Coordinate | null {
  if (!value) return null;
  const [latStr, lngStr] = value.split(',');
  if (latStr === undefined || lngStr === undefined || !latStr.trim() || !lngStr.trim()) return null;
  return toCoordinate(Number(latStr), Number(lngStr));
}

export function toCoordinate(lat: number, lng: number): Coordinate | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

export function formatCoordinate(coord: Coordinate): string {
  return `${coord.lat.toFixed(6)},${coord.lng.toFixed(6)}`;
}

export function buildGoogleMapsUrl(coord: Coordinate): string {
  return `https://www.google.com/maps/search/?api=1&query=${formatCoordinate(coord)}`;
}

// ค้นหาสถานที่จากข้อความ (ใช้เลื่อนแผนที่ไปยังบริเวณที่อยู่ที่กรอกไว้)
export async function searchPlace(query: string): Promise<Coordinate | null> {
  const q = query.trim();
  if (!q) return null;
  const params = new URLSearchParams({
    format: 'jsonv2',
    q,
    countrycodes: 'th',
    limit: '1',
    'accept-language': 'th',
  });
  const res = await fetch(`${NOMINATIM_URL}/search?${params.toString()}`);
  if (!res.ok) throw new Error(`Nominatim search failed: ${res.status}`);
  const results = (await res.json()) as { lat: string; lon: string }[];
  const first = results[0];
  return first ? toCoordinate(Number(first.lat), Number(first.lon)) : null;
}

const ADMIN_PREFIX = /^(จังหวัด|อำเภอ|เขต|ตำบล|แขวง|จ\.|อ\.|ต\.)\s*/;
const normalizeName = (s: string) => s.trim().replace(ADMIN_PREFIX, '').trim();

interface NominatimReverse {
  address?: Record<string, string>;
}

// แปลงพิกัดเป็นที่อยู่ โดยจับคู่ผลจาก Nominatim กับข้อมูลที่อยู่ไทยของระบบ
// เพื่อให้ชื่อตำบล/อำเภอ/จังหวัดสะกดตรงกับที่ช่อง autocomplete ใช้ (จับคู่ไม่ได้ = null)
export async function reverseGeocode(coord: Coordinate): Promise<ThaiAddress | null> {
  const params = new URLSearchParams({
    format: 'jsonv2',
    lat: String(coord.lat),
    lon: String(coord.lng),
    zoom: '18',
    addressdetails: '1',
    'accept-language': 'th',
  });
  const res = await fetch(`${NOMINATIM_URL}/reverse?${params.toString()}`);
  if (!res.ok) throw new Error(`Nominatim reverse failed: ${res.status}`);
  const data = (await res.json()) as NominatimReverse;
  if (!data.address) return null;

  const postcode = data.address.postcode;
  const names = new Set(
    Object.entries(data.address)
      .filter(([key]) => key !== 'postcode' && key !== 'country' && key !== 'country_code')
      .map(([, value]) => normalizeName(value)),
  );

  let best: ThaiAddress | null = null;
  let bestScore = 0;
  for (const item of useThaiAddress().addresses) {
    if (!names.has(item.province)) continue;
    const amphoeHit = names.has(item.amphoe);
    const districtHit = names.has(item.district);
    if (!amphoeHit && !districtHit) continue;
    const score =
      4 + (amphoeHit ? 2 : 0) + (districtHit ? 2 : 0) + (String(item.zipcode) === postcode ? 1 : 0);
    if (score > bestScore) {
      best = item;
      bestScore = score;
    }
  }
  return best;
}
