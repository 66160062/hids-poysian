import {
  computeCompletionScore,
  CompletionScore,
  FailedSystem,
  ScoredDefect,
  ScoredSummaryItem,
} from './completion-score.util';

export interface RoundStatsDefect extends ScoredDefect {
  // หมวดงานหลักที่ใช้โชว์ในรายงาน (subCategories[0]) — ต่างจาก categoryNames ที่ใช้คิดคะแนน
  categoryName: string;
  floorName: string;
}

export interface NamedCount {
  name: string;
  count: number;
}

export interface RoundStats {
  completionPercent: number;
  defectScore: number;
  systemScore: number | null;
  systemAssessedCount: number;
  systemPassedCount: number;
  failedSystems: FailedSystem[];
  totalDefects: number;
  majorCount: number;
  minorCount: number;
  statusCounts: Record<string, number>;
  topCategories: NamedCount[];
  topFloors: NamedCount[];
}

export interface RoundStatsInput {
  defects: RoundStatsDefect[];
  summaryItems: ScoredSummaryItem[];
  usableArea: number | null | undefined;
  floorCount: number | null | undefined;
}

const TOP_N = 3;

function topCounts(names: string[]): NamedCount[] {
  const counts = new Map<string, number>();
  for (const name of names) {
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, TOP_N);
}

export function buildRoundStats(input: RoundStatsInput): RoundStats {
  const { defects } = input;

  const statusCounts: Record<string, number> = {};
  for (const d of defects) {
    statusCounts[d.status] = (statusCounts[d.status] ?? 0) + 1;
  }

  const score: CompletionScore = computeCompletionScore({
    defects,
    summaryItems: input.summaryItems,
    usableArea: input.usableArea,
    floorCount: input.floorCount,
  });

  return {
    completionPercent: score.percent,
    defectScore: score.defectScore,
    systemScore: score.systemScore,
    systemAssessedCount: score.systemAssessedCount,
    systemPassedCount: score.systemPassedCount,
    failedSystems: score.failedSystems,
    totalDefects: defects.length,
    majorCount: defects.filter((d) => d.severity === 'Major').length,
    minorCount: defects.filter((d) => d.severity === 'Minor').length,
    statusCounts,
    topCategories: topCounts(defects.map((d) => d.categoryName)),
    topFloors: topCounts(defects.map((d) => d.floorName)),
  };
}

// สั่ง AI ตรงๆ ว่าห้ามคิดเลขเอง ต้องใช้ตัวเลขที่ให้ไปเป๊ะๆ กันโมเดล hallucinate เปอร์เซ็นต์หรือจำนวนใหม่
export function buildSummaryPrompt(stats: RoundStats): string {
  const categoriesLine =
    stats.topCategories.length > 0
      ? stats.topCategories.map((c) => `${c.name} (${c.count} จุด)`).join(', ')
      : 'ไม่มี';
  const floorsLine =
    stats.topFloors.length > 0
      ? stats.topFloors.map((f) => `${f.name} (${f.count} จุด)`).join(', ')
      : 'ไม่มี';

  const severityLine = `Major ${stats.majorCount} จุด, Minor ${stats.minorCount} จุด`;

  // ส่วนผลตรวจระบบใส่เข้าไปเฉพาะเมื่อรอบนี้มีการกรอกจริง ไม่งั้น AI จะพูดถึงข้อมูลที่ไม่มี
  const systemBlock =
    stats.systemScore === null
      ? '- ผลตรวจระบบท้ายเล่ม: รอบนี้ยังไม่ได้กรอก (ห้ามพูดถึงส่วนนี้)'
      : [
          `- คะแนนส่วนผลตรวจระบบ: ${stats.systemScore}% (ผ่าน ${stats.systemPassedCount} จาก ${stats.systemAssessedCount} รายการที่ประเมิน)`,
          stats.failedSystems.length > 0
            ? `- รายการตรวจระบบที่ไม่ผ่าน: ${stats.failedSystems
                .map((f) => `${f.label} (${f.value})`)
                .join(', ')}`
            : '- รายการตรวจระบบที่ไม่ผ่าน: ไม่มี ผ่านครบทุกรายการ',
        ].join('\n');

  return `คุณเป็นผู้ช่วยเขียนสรุปผลตรวจบ้านท้ายเล่มรายงาน สำหรับส่งให้ลูกค้าอ่าน

ข้อมูลตัวเลขต่อไปนี้คำนวณไว้แล้วและถูกต้อง 100% ห้ามคำนวณใหม่ ห้ามเปลี่ยนตัวเลข และห้ามเพิ่มข้อมูลที่ไม่ได้ให้มา:
- % ความสมบูรณ์ของบ้านโดยรวม: ${stats.completionPercent}%
- คะแนนส่วน defect: ${stats.defectScore}%
${systemBlock}
- จำนวน defect ทั้งหมด: ${stats.totalDefects} จุด (${severityLine})
- หมวดงานที่พบ defect มากที่สุด: ${categoriesLine}
- ชั้นที่พบ defect มากที่สุด: ${floorsLine}

เขียนสรุปเป็นภาษาไทย 4-6 ประโยค น้ำเสียงเป็นทางการแต่อ่านลื่น โดย:
1. เริ่มด้วยการบอก % ความสมบูรณ์โดยรวมตามตัวเลขที่ให้มาเป๊ะๆ
2. พูดถึงจุดที่พบ defect หลักว่าส่วนใหญ่อยู่ที่หมวดงาน/ชั้นไหน
3. ถ้ามีรายการตรวจระบบที่ไม่ผ่าน ให้ระบุชื่อรายการนั้นด้วยว่าเป็นจุดที่ต้องตามแก้
4. ปิดท้ายด้วยคำแนะนำสั้นๆ ว่าควรติดตามการซ่อมในจุดใดก่อน

กฎการเขียนที่ต้องทำตามเป๊ะๆ:
- เขียนตัวเลข % ติดกับเครื่องหมาย % เสมอ ห้ามเว้นวรรค (เขียน "82%" ห้ามเขียน "82 %")
- แบ่งเป็นประโยคสั้นๆ หลายประโยคที่อ่านลื่น ห้ามเรียงข้อมูลทุกอย่างต่อกันเป็นประโยคเดียวยาวๆ ด้วยคำว่า "ซึ่ง"/"โดย"/"และ" ซ้อนกันหลายชั้น
- ตัวอย่างโทนและจังหวะประโยคที่ต้องการ (ใช้เป็นแนวการเขียนเท่านั้น ห้ามใช้ตัวเลขในตัวอย่างนี้เด็ดขาด):
  "บ้านหลังนี้มีความสมบูรณ์โดยรวมอยู่ที่ 90% จุดที่ควรให้ความสำคัญเป็นพิเศษคือหมวดงานสีบริเวณชั้น 2 ซึ่งพบข้อบกพร่องมากที่สุด นอกจากนี้รายการตรวจระบบไฟฟ้ายังไม่ผ่านการประเมิน จึงควรติดตามการแก้ไขในจุดนี้ก่อนเป็นลำดับแรก"
ห้ามใส่หัวข้อ ห้ามใส่ bullet point ตอบเป็นย่อหน้าเดียวเท่านั้น`;
}
