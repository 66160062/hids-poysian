import {
  categoryCriticality,
  classifySummaryOption,
  computeCompletionScore,
  computeScope,
  CRITICALITY_COSMETIC,
  CRITICALITY_CRITICAL,
  CRITICALITY_STANDARD,
  MIN_SCOPE,
  OUTSTANDING_WORK_CAP,
  ScoredDefect,
  ScoredSummaryItem,
} from './completion-score.util';

// บ้านตัวอย่างขนาดจริงจากฐานข้อมูล: บ้านเดี่ยว 135 ตร.ม. 2 ชั้น
const HOUSE = { usableArea: 135, floorCount: 2 };

function defect(
  severity: string,
  status: string,
  categoryNames: string[] = ['ประตู'],
): ScoredDefect {
  return { severity, status, categoryNames };
}

function summaryItem(category: string, optionValue: string): ScoredSummaryItem {
  return { category, label: `${category} - รายการตรวจ`, optionValue };
}

describe('categoryCriticality', () => {
  it('treats structural and core-system work as critical', () => {
    expect(categoryCriticality('งานโครงสร้าง')).toBe(CRITICALITY_CRITICAL);
    expect(categoryCriticality('งานระบบไฟฟ้า')).toBe(CRITICALITY_CRITICAL);
    expect(categoryCriticality('งานระบบประปา')).toBe(CRITICALITY_CRITICAL);
    expect(categoryCriticality('หลังคา')).toBe(CRITICALITY_CRITICAL);
    expect(categoryCriticality('ราวบันได')).toBe(CRITICALITY_CRITICAL);
  });

  it('treats decorative work as cosmetic', () => {
    expect(categoryCriticality('ผ้าม่าน')).toBe(CRITICALITY_COSMETIC);
    expect(categoryCriticality('วอลล์เปเปอร์')).toBe(CRITICALITY_COSMETIC);
    expect(categoryCriticality('เฟอร์นิเจอร์')).toBe(CRITICALITY_COSMETIC);
  });

  it('classifies บัวฝ้าเพดาน as cosmetic even though it contains the standard keyword ฝ้าเพดาน', () => {
    expect(categoryCriticality('บัวฝ้าเพดาน')).toBe(CRITICALITY_COSMETIC);
    expect(categoryCriticality('ฝ้าเพดาน')).toBe(CRITICALITY_STANDARD);
  });

  it('falls back to standard for unknown or empty categories', () => {
    expect(categoryCriticality('ประตู')).toBe(CRITICALITY_STANDARD);
    expect(categoryCriticality(null)).toBe(CRITICALITY_STANDARD);
    expect(categoryCriticality('')).toBe(CRITICALITY_STANDARD);
  });
});

describe('classifySummaryOption', () => {
  // ค่าจริงทั้งหมดที่มีอยู่ใน summary_template_option
  it.each([
    'ไม่พบปัญหา',
    'ไม่พบปัญหาทางด้านโครงสร้าง',
    'ไม่พบปัญหาการทรุดตัว',
    'ไม่พบปัญหาน้ำขัง',
    'ไม่พบปัญหาการรั่วซึม',
    'ติดตั้งเรียบร้อย',
    'ตรวจสอบครบทุกจุด',
    'พร้อมเข้าอยู่อาศัย',
  ])('classifies %s as pass', (value) => {
    expect(classifySummaryOption(value)).toBe('pass');
  });

  it.each([
    'พบปัญหา',
    'พบปัญหาทางด้านโครงสร้าง',
    'พบปัญหาการทรุดตัว',
    'พบปัญหาน้ำขัง',
    'พบปัญหาการรั่วซึม',
    'ยังไม่ได้ติดตั้ง',
    'ยังไม่พร้อมเข้าอยู่อาศัย',
  ])('classifies %s as fail', (value) => {
    expect(classifySummaryOption(value)).toBe('fail');
  });

  it.each([
    'เหนือ',
    'ตะวันออกเฉียงเหนือ',
    'ผนังก่ออิฐฉาบปูน',
    'ผนังเบา',
    'โครงหลังคาสำเร็จรูป',
    '100 แอมป์',
    '3 Pole',
  ])('classifies %s as descriptive so it is not scored', (value) => {
    expect(classifySummaryOption(value)).toBe('descriptive');
  });

  it('treats empty or missing values as descriptive', () => {
    expect(classifySummaryOption('')).toBe('descriptive');
    expect(classifySummaryOption(null)).toBe('descriptive');
  });
});

describe('computeScope', () => {
  it('grows with usable area and floor count', () => {
    expect(computeScope(135, 2)).toBeCloseTo(17.5);
    expect(computeScope(200, 2)).toBeGreaterThan(computeScope(135, 2));
    expect(computeScope(135, 3)).toBeGreaterThan(computeScope(135, 2));
  });

  it('falls back to the minimum scope when the house size is missing or zero', () => {
    expect(computeScope(null, null)).toBe(MIN_SCOPE);
    expect(computeScope(0, 0)).toBe(MIN_SCOPE);
  });
});

describe('computeCompletionScore', () => {
  it('returns 100 when there are no defects and every system check passes', () => {
    const score = computeCompletionScore({
      ...HOUSE,
      defects: [],
      summaryItems: [
        summaryItem('งานโครงสร้าง', 'ไม่พบปัญหาทางด้านโครงสร้าง'),
        summaryItem('งานระบบไฟฟ้า', 'ติดตั้งเรียบร้อย'),
      ],
    });

    expect(score.percent).toBe(100);
    expect(score.defectScore).toBe(100);
    expect(score.systemScore).toBe(100);
    expect(score.failedSystems).toEqual([]);
  });

  it('keeps a single defect close to 100% instead of dropping it sharply', () => {
    const score = computeCompletionScore({
      ...HOUSE,
      defects: [defect('Major', 'pending_repair')],
      summaryItems: [summaryItem('งานโครงสร้าง', 'ไม่พบปัญหาทางด้านโครงสร้าง')],
    });

    expect(score.percent).toBeGreaterThanOrEqual(95);
  });

  it('never reports a full 100% while a defect is still waiting to be repaired', () => {
    const score = computeCompletionScore({
      ...HOUSE,
      // defect เล็กมากจนคะแนนดิบปัดขึ้นเป็น 100 ได้ แต่ยังรอซ่อมอยู่
      defects: [defect('Minor', 'pending_repair', ['ผ้าม่าน'])],
      summaryItems: [summaryItem('งานโครงสร้าง', 'ไม่พบปัญหาทางด้านโครงสร้าง')],
    });

    expect(score.percent).toBe(OUTSTANDING_WORK_CAP);
  });

  it('never reports a full 100% while a system check is still failing', () => {
    const score = computeCompletionScore({
      ...HOUSE,
      defects: [],
      summaryItems: [
        ...Array.from({ length: 40 }, () =>
          summaryItem('ความสะอาดและความเรียบร้อย', 'พร้อมเข้าอยู่อาศัย'),
        ),
        summaryItem('ความสะอาดและความเรียบร้อย', 'ยังไม่พร้อมเข้าอยู่อาศัย'),
      ],
    });

    expect(score.percent).toBe(OUTSTANDING_WORK_CAP);
  });

  it('allows a full 100% once every defect has been repaired and verified', () => {
    const score = computeCompletionScore({
      ...HOUSE,
      defects: [defect('Minor', 'verified'), defect('Major', 'verified')],
      summaryItems: [summaryItem('งานโครงสร้าง', 'ไม่พบปัญหาทางด้านโครงสร้าง')],
    });

    expect(score.percent).toBe(100);
  });

  it('penalises a Major defect more than a Minor one', () => {
    const forSeverity = (severity: string) =>
      computeCompletionScore({
        ...HOUSE,
        defects: [defect(severity, 'pending_repair')],
        summaryItems: [],
      }).percent;

    expect(forSeverity('Major')).toBeLessThan(forSeverity('Minor'));
  });

  it('penalises a structural defect more than a decorative one of the same severity', () => {
    const structural = computeCompletionScore({
      ...HOUSE,
      defects: [defect('Major', 'pending_repair', ['งานโครงสร้าง'])],
      summaryItems: [],
    }).percent;
    const decorative = computeCompletionScore({
      ...HOUSE,
      defects: [defect('Major', 'pending_repair', ['ผ้าม่าน'])],
      summaryItems: [],
    }).percent;

    expect(structural).toBeLessThan(decorative);
  });

  it('uses the most critical category when a defect spans several categories', () => {
    const mixed = computeCompletionScore({
      ...HOUSE,
      defects: [defect('Major', 'pending_repair', ['ผ้าม่าน', 'งานโครงสร้าง'])],
      summaryItems: [],
    }).percent;
    const structuralOnly = computeCompletionScore({
      ...HOUSE,
      defects: [defect('Major', 'pending_repair', ['งานโครงสร้าง'])],
      summaryItems: [],
    }).percent;

    expect(mixed).toBe(structuralOnly);
  });

  it('scores a large house higher than a small one for the same defect', () => {
    const big = computeCompletionScore({
      usableArea: 300,
      floorCount: 3,
      defects: [defect('Major', 'pending_repair')],
      summaryItems: [],
    }).percent;
    const small = computeCompletionScore({
      usableArea: 30,
      floorCount: 1,
      defects: [defect('Major', 'pending_repair')],
      summaryItems: [],
    }).percent;

    expect(big).toBeGreaterThan(small);
  });

  it('recovers most of the score once defects are verified as repaired', () => {
    const pending = computeCompletionScore({
      ...HOUSE,
      defects: [
        defect('Major', 'pending_repair'),
        defect('Major', 'pending_repair'),
      ],
      summaryItems: [],
    }).percent;
    const verified = computeCompletionScore({
      ...HOUSE,
      defects: [defect('Major', 'verified'), defect('Major', 'verified')],
      summaryItems: [],
    }).percent;

    expect(verified).toBeGreaterThan(pending);
    expect(verified).toBeGreaterThanOrEqual(98);
  });

  it('treats a rejected repair as still fully outstanding', () => {
    const rejected = computeCompletionScore({
      ...HOUSE,
      defects: [defect('Major', 'rejected')],
      summaryItems: [],
    }).percent;
    const pending = computeCompletionScore({
      ...HOUSE,
      defects: [defect('Major', 'pending_repair')],
      summaryItems: [],
    }).percent;

    expect(rejected).toBe(pending);
  });

  it('drags the score down when system checks fail even with no defects at all', () => {
    const score = computeCompletionScore({
      ...HOUSE,
      defects: [],
      summaryItems: [
        summaryItem('งานระบบไฟฟ้า', 'ยังไม่ได้ติดตั้ง'),
        summaryItem('งานประปาและสุขาภิบาล', 'พบปัญหา'),
        summaryItem('งานโครงสร้าง', 'ไม่พบปัญหาทางด้านโครงสร้าง'),
      ],
    });

    expect(score.defectScore).toBe(100);
    expect(score.percent).toBeLessThan(80);
    expect(score.failedSystems).toHaveLength(2);
    expect(score.systemAssessedCount).toBe(3);
    expect(score.systemPassedCount).toBe(1);
  });

  it('ignores descriptive options so they neither help nor hurt the system score', () => {
    const withDescriptive = computeCompletionScore({
      ...HOUSE,
      defects: [],
      summaryItems: [
        summaryItem('งานโครงสร้าง', 'พบปัญหาทางด้านโครงสร้าง'),
        summaryItem('ทิศทางของบ้าน', 'เหนือ'),
        summaryItem('งานระบบไฟฟ้า', '100 แอมป์'),
      ],
    });

    expect(withDescriptive.systemAssessedCount).toBe(1);
    expect(withDescriptive.systemScore).toBe(0);
  });

  it('falls back to a defect-only score when the round has no system checks filled in', () => {
    const score = computeCompletionScore({
      ...HOUSE,
      defects: [defect('Major', 'pending_repair')],
      summaryItems: [],
    });

    expect(score.systemScore).toBeNull();
    expect(score.percent).toBe(score.defectScore);
  });

  it('clamps at 0 rather than going negative when the house is overwhelmed with defects', () => {
    const score = computeCompletionScore({
      ...HOUSE,
      defects: Array.from({ length: 60 }, () =>
        defect('Major', 'pending_repair', ['งานโครงสร้าง']),
      ),
      summaryItems: [summaryItem('งานโครงสร้าง', 'พบปัญหาทางด้านโครงสร้าง')],
    });

    expect(score.percent).toBe(0);
    expect(score.defectScore).toBe(0);
  });
});
