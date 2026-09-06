import {
  buildRoundStats,
  buildSummaryPrompt,
  RoundStats,
  RoundStatsDefect,
} from './round-stats.util';

const HOUSE = { usableArea: 135, floorCount: 2 };

function defect(overrides: Partial<RoundStatsDefect> = {}): RoundStatsDefect {
  return {
    severity: 'Minor',
    status: 'pending_repair',
    categoryName: 'สี',
    categoryNames: ['สี'],
    floorName: 'ชั้น 1',
    ...overrides,
  };
}

function baseStats(overrides: Partial<RoundStats> = {}): RoundStats {
  return {
    completionPercent: 82,
    defectScore: 90,
    systemScore: 70,
    systemAssessedCount: 10,
    systemPassedCount: 7,
    failedSystems: [],
    totalDefects: 5,
    majorCount: 2,
    minorCount: 3,
    statusCounts: {},
    topCategories: [{ name: 'โครงสร้าง', count: 2 }],
    topFloors: [{ name: 'ชั้น 1', count: 3 }],
    ...overrides,
  };
}

describe('buildRoundStats', () => {
  it('counts each severity separately from the total', () => {
    const stats = buildRoundStats({
      ...HOUSE,
      summaryItems: [],
      defects: [
        defect({ severity: 'Major' }),
        defect({ severity: 'Minor' }),
        defect({ severity: 'Minor' }),
      ],
    });

    expect(stats.totalDefects).toBe(3);
    expect(stats.majorCount).toBe(1);
    expect(stats.minorCount).toBe(2);
  });

  it('ranks top categories and floors by descending count', () => {
    const stats = buildRoundStats({
      ...HOUSE,
      summaryItems: [],
      defects: [
        defect({ categoryName: 'สี', floorName: 'ชั้น 1' }),
        defect({ categoryName: 'สี', floorName: 'ชั้น 1' }),
        defect({ categoryName: 'ไฟฟ้า', floorName: 'ชั้น 2' }),
      ],
    });

    expect(stats.topCategories[0]).toMatchObject({ name: 'สี', count: 2 });
    expect(stats.topFloors[0]).toMatchObject({ name: 'ชั้น 1', count: 2 });
  });

  it('carries the sub-scores and failing system checks through from the score calculation', () => {
    const stats = buildRoundStats({
      ...HOUSE,
      defects: [],
      summaryItems: [
        {
          category: 'งานระบบไฟฟ้า',
          label: 'มิเตอร์ไฟฟ้า',
          optionValue: 'ยังไม่ได้ติดตั้ง',
        },
        {
          category: 'งานโครงสร้าง',
          label: 'ฐานราก',
          optionValue: 'ไม่พบปัญหาการทรุดตัว',
        },
      ],
    });

    expect(stats.defectScore).toBe(100);
    expect(stats.systemScore).toBe(50);
    expect(stats.failedSystems).toEqual([
      {
        category: 'งานระบบไฟฟ้า',
        label: 'มิเตอร์ไฟฟ้า',
        value: 'ยังไม่ได้ติดตั้ง',
      },
    ]);
  });
});

describe('buildSummaryPrompt', () => {
  it('embeds the exact computed percent so the model cannot recompute it', () => {
    const prompt = buildSummaryPrompt(baseStats({ completionPercent: 82 }));

    expect(prompt).toContain('82%');
    expect(prompt).toContain('ห้ามคำนวณใหม่');
  });

  it('lists the top categories and floors by name and count', () => {
    const prompt = buildSummaryPrompt(
      baseStats({
        topCategories: [{ name: 'สี', count: 3 }],
        topFloors: [{ name: 'ชั้น 2', count: 4 }],
      }),
    );

    expect(prompt).toContain('สี (3 จุด)');
    expect(prompt).toContain('ชั้น 2 (4 จุด)');
  });

  it('names the failing system checks so the model can call them out specifically', () => {
    const prompt = buildSummaryPrompt(
      baseStats({
        failedSystems: [
          {
            category: 'งานระบบไฟฟ้า',
            label: 'มิเตอร์ไฟฟ้า',
            value: 'ยังไม่ได้ติดตั้ง',
          },
        ],
      }),
    );

    expect(prompt).toContain('มิเตอร์ไฟฟ้า (ยังไม่ได้ติดตั้ง)');
  });

  it('says the system checks all passed when nothing failed', () => {
    const prompt = buildSummaryPrompt(baseStats({ failedSystems: [] }));

    expect(prompt).toContain('ผ่านครบทุกรายการ');
  });

  it('tells the model not to mention system checks when the round has none filled in', () => {
    const prompt = buildSummaryPrompt(
      baseStats({ systemScore: null, systemAssessedCount: 0 }),
    );

    expect(prompt).toContain('ห้ามพูดถึงส่วนนี้');
  });

  it('falls back to "ไม่มี" when there are no categories or floors to report', () => {
    const prompt = buildSummaryPrompt(
      baseStats({ topCategories: [], topFloors: [] }),
    );

    expect(prompt).toContain('ไม่มี');
  });
});
