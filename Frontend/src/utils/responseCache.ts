// cache ผลลัพธ์ GET ไว้ในหน่วยความจำ เพื่อให้หน้าที่เคยเปิดแล้วแสดงข้อมูลเดิมได้ทันทีตอนกลับเข้ามา
// (stale-while-revalidate) แล้วค่อยโหลดของใหม่เบื้องหลัง แทนที่จะให้ผู้ใช้ดู spinner เต็มจอทุกครั้ง
// ไม่เก็บลง storage — รีเฟรชหน้าเว็บแล้วเริ่มใหม่ ซึ่งปลอดภัยกว่าเรื่องข้อมูลค้างข้ามผู้ใช้
const cache = new Map<string, unknown>();

export function cacheKey(url: string, params?: Record<string, unknown>): string {
  return params ? `${url}?${JSON.stringify(params)}` : url;
}

export function peekCache<T>(key: string): T | undefined {
  return cache.get(key) as T | undefined;
}

export function setCache<T>(key: string, value: T): void {
  cache.set(key, value);
}

export function invalidateCache(prefix?: string): void {
  if (!prefix) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}
