// ชื่อชั้นที่ใช้เทียบกัน: ตัดช่องว่างหัวท้าย ยุบช่องว่างซ้อน และไม่สนตัวพิมพ์
export function normalizeFloorLabel(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('th');
}
