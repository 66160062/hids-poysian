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
  // ชื่ออังกฤษ (ถ้ามี) ใช้เฉพาะตอนสร้างสรุปภาษาอังกฤษ
  categoryNameEn?: string | null;
  floorNameEn?: string | null;
}

export interface NamedCount {
  name: string;
  nameEn?: string | null;
  count: number;
}

export type SummaryLocale = 'th-TH' | 'en-US';

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

function topCounts(
  entries: { name: string; nameEn?: string | null }[],
): NamedCount[] {
  // นับตามชื่อไทย (เป็น key หลัก) และเก็บชื่ออังกฤษตัวแรกที่เจอไว้ใช้แสดงผล
  const counts = new Map<string, NamedCount>();
  for (const { name, nameEn } of entries) {
    const existing = counts.get(name);
    if (existing) {
      existing.count += 1;
      existing.nameEn ??= nameEn;
    } else {
      counts.set(name, { name, nameEn, count: 1 });
    }
  }
  return [...counts.values()].sort((a, b) => b.count - a.count).slice(0, TOP_N);
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
    topCategories: topCounts(
      defects.map((d) => ({ name: d.categoryName, nameEn: d.categoryNameEn })),
    ),
    topFloors: topCounts(
      defects.map((d) => ({ name: d.floorName, nameEn: d.floorNameEn })),
    ),
  };
}

export function buildSummaryPrompt(
  stats: RoundStats,
  locale: SummaryLocale = 'th-TH',
): string {
  return locale === 'en-US'
    ? buildEnglishSummaryPrompt(stats)
    : buildThaiSummaryPrompt(stats);
}

// สั่ง AI ตรงๆ ว่าห้ามคิดเลขเอง ต้องใช้ตัวเลขที่ให้ไปเป๊ะๆ กันโมเดล hallucinate เปอร์เซ็นต์หรือจำนวนใหม่
function buildThaiSummaryPrompt(stats: RoundStats): string {
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

// ฉบับอังกฤษ: ใช้ชื่อหมวด/ชั้น/รายการตรวจระบบภาษาอังกฤษจากฐานข้อมูล ถ้าไม่มีให้ใช้ชื่อไทยและสั่งให้โมเดลแปลเป็นอังกฤษ
function buildEnglishSummaryPrompt(stats: RoundStats): string {
  const named = (items: NamedCount[]) =>
    items.length > 0
      ? items.map((i) => `${i.nameEn || i.name} (${i.count} items)`).join(', ')
      : 'none';

  const severityLine = `${stats.majorCount} Major, ${stats.minorCount} Minor`;

  const systemBlock =
    stats.systemScore === null
      ? '- Building systems check: not filled in for this round (do not mention it)'
      : [
          `- Building systems score: ${stats.systemScore}% (${stats.systemPassedCount} of ${stats.systemAssessedCount} assessed items passed)`,
          stats.failedSystems.length > 0
            ? `- Failed system checks: ${stats.failedSystems
                .map((f) => `${f.labelEn || f.label} (${f.valueEn || f.value})`)
                .join(', ')}`
            : '- Failed system checks: none, all items passed',
        ].join('\n');

  return `You are an assistant who writes the closing summary of a home inspection report that will be read by the customer.

The following figures are already calculated and 100% correct. Do not recalculate them, do not change them, and do not add any information that is not provided:
- Overall home completion: ${stats.completionPercent}%
- Defect score: ${stats.defectScore}%
${systemBlock}
- Total defects: ${stats.totalDefects} (${severityLine})
- Work categories with the most defects: ${named(stats.topCategories)}
- Floors with the most defects: ${named(stats.topFloors)}

Write the summary in English, 4-6 sentences, in a formal but readable tone:
1. Start by stating the overall completion percentage exactly as given.
2. Mention where the main defects are, by work category and floor.
3. If any system check failed, name it as an item that needs follow-up.
4. Close with a short recommendation on which repairs to follow up first.

Rules:
- Write the percent sign directly after the number with no space (write "82%", never "82 %").
- Use several short sentences. Do not chain everything into one long sentence.
- If any item name above is in Thai, translate it into natural English.
- Example of the desired tone and rhythm (use as a style guide only, never reuse its numbers): "Overall, this home is 90% complete. The areas that need the most attention are the painting work on the second floor, where the most defects were found. The electrical system check also did not pass, so it should be followed up first."
- No headings, no bullet points. Answer as a single paragraph only.`;
}
