export interface PlanPinInput {
  id: number;
  x: number; // % ของความกว้างรูป
  y: number; // % ของความสูงรูป
  displayIndex: number;
  isMajor: boolean;
}

export interface PlanPinCluster {
  key: string;
  x: number;
  y: number;
  label: string;
  isMajor: boolean;
}

const MAX_LABEL_LENGTH = 7;

// [3,4,5,9] → "3–5,9" ; ยาวเกินจะล้นหมุด เลยย่อเป็น "3+3"
export function formatPinLabel(indexes: number[]): string {
  const sorted = [...indexes].sort((a, b) => a - b);
  const parts: string[] = [];
  for (let i = 0; i < sorted.length; ) {
    let j = i;
    while (j + 1 < sorted.length && sorted[j + 1] === sorted[j]! + 1) j++;
    parts.push(j - i >= 2 ? `${sorted[i]}–${sorted[j]}` : sorted.slice(i, j + 1).join(','));
    i = j + 1;
  }
  const label = parts.join(',');
  return label.length <= MAX_LABEL_LENGTH ? label : `${sorted[0]}+${sorted.length - 1}`;
}

// รวมหมุดที่ห่างกันน้อยกว่า minDistancePx (วัดบนรูปขนาดที่ render จริง) เป็นกลุ่มเดียว
// ใช้ union-find: A ใกล้ B และ B ใกล้ C → A, B, C อยู่กลุ่มเดียวกันแม้ A กับ C จะห่างกัน
export function clusterPlanPins(
  pins: PlanPinInput[],
  imageSizePx: { width: number; height: number } | undefined,
  minDistancePx: number,
): PlanPinCluster[] {
  const parent = pins.map((_, i) => i);
  const find = (i: number): number => {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]!]!;
      i = parent[i]!;
    }
    return i;
  };

  // ยังไม่รู้ขนาดรูป (ยังไม่โหลด/ถูกซ่อน) → ไม่รวม ดีกว่ารวมผิด
  if (imageSizePx && imageSizePx.width > 0 && imageSizePx.height > 0) {
    for (let a = 0; a < pins.length; a++) {
      for (let b = a + 1; b < pins.length; b++) {
        const dx = ((pins[a]!.x - pins[b]!.x) / 100) * imageSizePx.width;
        const dy = ((pins[a]!.y - pins[b]!.y) / 100) * imageSizePx.height;
        if (Math.hypot(dx, dy) < minDistancePx) parent[find(a)] = find(b);
      }
    }
  }

  const groups = new Map<number, PlanPinInput[]>();
  pins.forEach((pin, i) => {
    const root = find(i);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root)!.push(pin);
  });

  return Array.from(groups.values()).map((members) => ({
    key: members.map((m) => m.id).join('-'),
    x: members.reduce((sum, m) => sum + m.x, 0) / members.length,
    y: members.reduce((sum, m) => sum + m.y, 0) / members.length,
    label: formatPinLabel(members.map((m) => m.displayIndex)),
    isMajor: members.some((m) => m.isMajor),
  }));
}
