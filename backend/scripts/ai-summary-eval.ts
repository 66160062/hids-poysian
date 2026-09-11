/*
 * เปรียบเทียบโมเดล AI หลายตัวสำหรับงานสรุปผลตรวจบ้านท้ายเล่ม (ใช้ประกอบการสอบ/นำเสนออาจารย์)
 *
 * รันจาก backend/:
 *   npm run eval:ai-summary
 *
 * ต้องตั้ง .env ให้มี API key ของ provider ที่ต้องการเทส อย่างน้อย 1 ตัว:
 *   ANTHROPIC_API_KEY  (Claude, เสียเงิน)
 *   GEMINI_API_KEY     (Gemini, มี free tier)
 *   GROQ_API_KEY       (Groq/Llama, มี free tier)
 *   OLLAMA_MODEL       (โมเดล local ผ่าน Ollama, ฟรี 100% แต่ต้องรัน `ollama serve` เองก่อน)
 *
 * ไม่แตะฐานข้อมูลจริง — ใช้ข้อมูลจำลอง 3 สถานการณ์ (บ้านสภาพดี/ปานกลาง/มีปัญหาเยอะ) ที่ให้ทุกโมเดล
 * เห็นข้อมูลชุดเดียวกันเป๊ะๆ เพื่อเทียบกันแบบ apples-to-apples
 *
 * ผลลัพธ์: ai-summary-eval-results.json (ข้อมูลดิบ) + ai-summary-eval-report.html (กราฟ/ตารางเปิดดูในเบราว์เซอร์ได้เลย)
 */
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

import { ClaudeProvider } from '../src/ai-summary/providers/claude.provider';
import { GeminiProvider } from '../src/ai-summary/providers/gemini.provider';
import { GroqProvider } from '../src/ai-summary/providers/groq.provider';
import { OllamaProvider } from '../src/ai-summary/providers/ollama.provider';
import { LlmProvider } from '../src/ai-summary/providers/llm-provider.interface';
import {
  buildRoundStats,
  buildSummaryPrompt,
  RoundStats,
  RoundStatsDefect,
} from '../src/ai-summary/round-stats.util';
import { ScoredSummaryItem } from '../src/ai-summary/completion-score.util';

// ราคาโดยประมาณ (USD ต่อ 1 ล้าน token) ณ ตอนเขียนสคริปต์นี้ — ราคาจริงเปลี่ยนได้ตลอด
// ตรวจสอบหน้าราคาปัจจุบันของแต่ละเจ้าก่อนนำตัวเลข cost ไปอ้างอิงในการสอบ/รายงาน
const PRICE_PER_MILLION_TOKENS: Record<
  string,
  { input: number; output: number }
> = {
  claude: { input: 1, output: 5 }, // ประมาณราคาระดับ Haiku
  gemini: { input: 0, output: 0 }, // อยู่ใน free tier ของ Google AI Studio
  groq: { input: 0, output: 0 }, // อยู่ใน free tier ของ Groq
  ollama: { input: 0, output: 0 }, // รันในเครื่องตัวเอง ไม่มีค่าใช้จ่ายต่อ token
};

interface Scenario {
  id: string;
  label: string;
  defects: RoundStatsDefect[];
  summaryItems: ScoredSummaryItem[];
  // บ้านตัวอย่างอิงขนาดจริงจากฐานข้อมูล: บ้านเดี่ยว ~135 ตร.ม. 2 ชั้น
  usableArea: number;
  floorCount: number;
}

function repeatDefect(
  count: number,
  severity: string,
  status: string,
  categoryName: string,
  floorName: string,
): RoundStatsDefect[] {
  return Array.from({ length: count }, () => ({
    severity,
    status,
    categoryName,
    categoryNames: [categoryName],
    floorName,
  }));
}

function systemCheck(
  category: string,
  label: string,
  optionValue: string,
): ScoredSummaryItem {
  return { category, label, optionValue };
}

const SCENARIOS: Scenario[] = [
  {
    id: 'good',
    label: 'บ้านสภาพดี',
    usableArea: 135,
    floorCount: 2,
    defects: [
      ...repeatDefect(2, 'Minor', 'verified', 'สี', 'ชั้น 1'),
      ...repeatDefect(1, 'Minor', 'repaired', 'ประตู', 'ชั้น 2'),
    ],
    summaryItems: [
      systemCheck('งานโครงสร้าง', 'ฐานราก', 'ไม่พบปัญหาการทรุดตัว'),
      systemCheck('งานระบบไฟฟ้า', 'มิเตอร์ไฟฟ้า', 'ติดตั้งเรียบร้อย'),
      systemCheck('งานประปาและสุขาภิบาล', 'งานระบบประปา', 'ไม่พบปัญหา'),
      systemCheck(
        'ความสะอาดและความเรียบร้อย',
        'การเข้าอยู่อาศัย',
        'พร้อมเข้าอยู่อาศัย',
      ),
    ],
  },
  {
    id: 'medium',
    label: 'บ้านสภาพปานกลาง',
    usableArea: 135,
    floorCount: 2,
    defects: [
      ...repeatDefect(3, 'Major', 'pending_repair', 'งานโครงสร้าง', 'ชั้น 1'),
      ...repeatDefect(4, 'Minor', 'pending_repair', 'สี', 'ชั้น 1'),
      ...repeatDefect(2, 'Minor', 'verified', 'งานระบบไฟฟ้า', 'ชั้น 2'),
    ],
    summaryItems: [
      systemCheck('งานโครงสร้าง', 'ฐานราก', 'ไม่พบปัญหาการทรุดตัว'),
      systemCheck('งานระบบไฟฟ้า', 'มิเตอร์ไฟฟ้า', 'ติดตั้งเรียบร้อย'),
      systemCheck(
        'งานประปาและสุขาภิบาล',
        'ตรวจสอบสโลปห้องน้ำ',
        'พบปัญหาน้ำขัง',
      ),
      systemCheck(
        'ความสะอาดและความเรียบร้อย',
        'การเข้าอยู่อาศัย',
        'พร้อมเข้าอยู่อาศัย',
      ),
    ],
  },
  {
    id: 'bad',
    label: 'บ้านมีปัญหาเยอะ',
    usableArea: 135,
    floorCount: 2,
    defects: [
      ...repeatDefect(6, 'Major', 'pending_repair', 'งานโครงสร้าง', 'ชั้น 1'),
      ...repeatDefect(4, 'Major', 'rejected', 'หลังคา', 'ชั้นดาดฟ้า'),
      ...repeatDefect(5, 'Minor', 'pending_repair', 'สุขาภิบาล', 'ชั้น 2'),
    ],
    summaryItems: [
      systemCheck('งานโครงสร้าง', 'ฐานราก', 'พบปัญหาการทรุดตัว'),
      systemCheck('งานระบบไฟฟ้า', 'เครื่องป้องกันไฟรั่ว', 'พบปัญหา'),
      systemCheck(
        'งานประปาและสุขาภิบาล',
        'ตรวจสอบการรั่วซึมจากพื้นห้องน้ำ',
        'พบปัญหาการรั่วซึม',
      ),
      systemCheck(
        'ความสะอาดและความเรียบร้อย',
        'การเข้าอยู่อาศัย',
        'ยังไม่พร้อมเข้าอยู่อาศัย',
      ),
    ],
  },
];

interface RubricResult {
  score: number;
  maxScore: number;
  details: string[];
}

// ตรวจสอบแบบ rule-based อัตโนมัติ — เป็น proxy คร่าวๆ ของ "ความแม่นยำ/ความเหมาะสม" ไม่ใช่การประเมินคุณภาพภาษาเต็มรูปแบบ
// (สำหรับข้อสอบ/วิทยานิพนธ์ ควรใช้คู่กับการอ่าน text จริงประกอบด้วย ดู "text" ในผลลัพธ์)
function scoreOutput(text: string, stats: RoundStats): RubricResult {
  const details: string[] = [];
  let score = 0;
  const maxScore = 5;

  // อนุญาตให้มีช่องว่างคั่นระหว่างตัวเลขกับ % ได้ (เช่น "99 %") — โมเดลบางตัวเว้นวรรคแบบนี้ แต่ตัวเลขยังถูกต้องเป๊ะ
  const mentionsExactPercent = new RegExp(
    `${stats.completionPercent}\\s?%`,
  ).test(text);
  if (mentionsExactPercent) {
    score += 2;
    details.push('✓ ใช้ % ตามที่คำนวณไว้เป๊ะๆ');
  } else {
    details.push('✗ ไม่พบ % ที่ถูกต้องในข้อความ (เสี่ยง hallucinate ตัวเลข)');
  }

  const mentionsCategory = stats.topCategories.some((c) =>
    text.includes(c.name),
  );
  if (mentionsCategory || stats.topCategories.length === 0) {
    score += 1;
    details.push('✓ พูดถึงหมวดงานที่พบ defect หลัก');
  } else {
    details.push('✗ ไม่พูดถึงหมวดงานที่พบ defect หลัก');
  }

  const isSingleParagraph = !/\n\s*\n|^\s*[-•]/m.test(text.trim());
  if (isSingleParagraph) {
    score += 1;
    details.push('✓ เป็นย่อหน้าเดียว ไม่มี bullet');
  } else {
    details.push('✗ มี bullet หรือหลายย่อหน้า (ผิดฟอร์แมตที่สั่ง)');
  }

  const length = text.trim().length;
  const reasonableLength = length >= 50 && length <= 800;
  if (reasonableLength) {
    score += 1;
    details.push(`✓ ความยาวเหมาะสม (${length} ตัวอักษร)`);
  } else {
    details.push(`✗ ความยาวผิดปกติ (${length} ตัวอักษร)`);
  }

  return { score, maxScore, details };
}

interface RunResult {
  providerId: string;
  providerLabel: string;
  isFree: boolean;
  scenarioId: string;
  scenarioLabel: string;
  latencyMs: number;
  promptTokens: number | null;
  completionTokens: number | null;
  costUsd: number | null;
  rubric: RubricResult;
  text: string;
  error: string | null;
}

function estimateCost(
  providerId: string,
  promptTokens: number | null,
  completionTokens: number | null,
): number | null {
  const price = PRICE_PER_MILLION_TOKENS[providerId];
  if (!price || promptTokens == null || completionTokens == null) return null;
  return (
    (promptTokens / 1_000_000) * price.input +
    (completionTokens / 1_000_000) * price.output
  );
}

async function main() {
  const providers: LlmProvider[] = [
    new ClaudeProvider(),
    new GeminiProvider(),
    new GroqProvider(),
    new OllamaProvider(),
  ];
  const configured = providers.filter((p) => p.isConfigured());

  if (configured.length === 0) {
    console.error(
      'ไม่มี provider ที่ configure ไว้เลย — ตั้งอย่างน้อย 1 ตัวใน backend/.env ' +
        '(ANTHROPIC_API_KEY / GEMINI_API_KEY / GROQ_API_KEY / OLLAMA_MODEL) แล้วรันใหม่',
    );
    process.exit(1);
  }

  console.log(
    `Provider ที่พร้อมทดสอบ: ${configured.map((p) => p.label).join(', ')}\n`,
  );

  const runs: RunResult[] = [];

  for (const scenario of SCENARIOS) {
    const stats = buildRoundStats(scenario);
    const prompt = buildSummaryPrompt(stats);

    for (const provider of configured) {
      process.stdout.write(`[${scenario.label}] ${provider.label} ... `);
      try {
        const result = await provider.generate(prompt);
        const cost = estimateCost(
          provider.id,
          result.promptTokens,
          result.completionTokens,
        );
        const rubric = scoreOutput(result.text, stats);

        runs.push({
          providerId: provider.id,
          providerLabel: provider.label,
          isFree: provider.isFree,
          scenarioId: scenario.id,
          scenarioLabel: scenario.label,
          latencyMs: result.latencyMs,
          promptTokens: result.promptTokens,
          completionTokens: result.completionTokens,
          costUsd: cost,
          rubric,
          text: result.text.trim(),
          error: null,
        });
        console.log(
          `เสร็จ (${result.latencyMs}ms, rubric ${rubric.score}/${rubric.maxScore})`,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        runs.push({
          providerId: provider.id,
          providerLabel: provider.label,
          isFree: provider.isFree,
          scenarioId: scenario.id,
          scenarioLabel: scenario.label,
          latencyMs: 0,
          promptTokens: null,
          completionTokens: null,
          costUsd: null,
          rubric: { score: 0, maxScore: 5, details: ['เรียก API ไม่สำเร็จ'] },
          text: '',
          error: message,
        });
        console.log(`ล้มเหลว: ${message}`);
      }
    }
  }

  const summary = configured.map((provider) => {
    const providerRuns = runs.filter(
      (r) => r.providerId === provider.id && !r.error,
    );
    const avg = (values: number[]) =>
      values.length > 0
        ? values.reduce((a, b) => a + b, 0) / values.length
        : null;

    return {
      providerId: provider.id,
      providerLabel: provider.label,
      isFree: provider.isFree,
      successCount: providerRuns.length,
      totalRuns: runs.filter((r) => r.providerId === provider.id).length,
      avgLatencyMs: avg(providerRuns.map((r) => r.latencyMs)),
      avgCostUsd: avg(
        providerRuns
          .map((r) => r.costUsd)
          .filter((c): c is number => c != null),
      ),
      avgRubricScore: avg(providerRuns.map((r) => r.rubric.score)),
    };
  });

  const output = {
    generatedAt: new Date().toISOString(),
    scenarios: SCENARIOS.map((s) => ({
      id: s.id,
      label: s.label,
      stats: buildRoundStats(s),
    })),
    runs,
    summary,
  };

  const outDir = __dirname;
  fs.writeFileSync(
    path.join(outDir, 'ai-summary-eval-results.json'),
    JSON.stringify(output, null, 2),
    'utf-8',
  );
  fs.writeFileSync(
    path.join(outDir, 'ai-summary-eval-report.html'),
    renderHtmlReport(output),
    'utf-8',
  );

  console.log('\nบันทึกผลแล้ว:');
  console.log(`  - ${path.join(outDir, 'ai-summary-eval-results.json')}`);
  console.log(
    `  - ${path.join(outDir, 'ai-summary-eval-report.html')} (เปิดในเบราว์เซอร์เพื่อดูกราฟ)`,
  );
}

function renderHtmlReport(data: {
  generatedAt: string;
  scenarios: { id: string; label: string; stats: RoundStats }[];
  runs: RunResult[];
  summary: {
    providerId: string;
    providerLabel: string;
    isFree: boolean;
    successCount: number;
    totalRuns: number;
    avgLatencyMs: number | null;
    avgCostUsd: number | null;
    avgRubricScore: number | null;
  }[];
}): string {
  const maxLatency = Math.max(
    1,
    ...data.summary.map((s) => s.avgLatencyMs ?? 0),
  );
  const maxCost = Math.max(
    0.000001,
    ...data.summary.map((s) => s.avgCostUsd ?? 0),
  );

  const summaryRows = data.summary
    .map(
      (s) => `
      <tr>
        <td>${s.providerLabel}${s.isFree ? ' <span class="tag-free">FREE</span>' : ''}</td>
        <td>${s.successCount}/${s.totalRuns}</td>
        <td>
          <div class="bar-track"><div class="bar" style="width:${((s.avgLatencyMs ?? 0) / maxLatency) * 100}%; background:#1976d2"></div></div>
          ${s.avgLatencyMs != null ? Math.round(s.avgLatencyMs) + ' ms' : '-'}
        </td>
        <td>
          <div class="bar-track"><div class="bar" style="width:${((s.avgCostUsd ?? 0) / maxCost) * 100}%; background:#ef4444"></div></div>
          ${s.avgCostUsd != null ? '$' + s.avgCostUsd.toFixed(6) : '$0 (free)'}
        </td>
        <td>
          <div class="bar-track"><div class="bar" style="width:${((s.avgRubricScore ?? 0) / 5) * 100}%; background:#4CAF50"></div></div>
          ${s.avgRubricScore != null ? s.avgRubricScore.toFixed(1) + ' / 5' : '-'}
        </td>
      </tr>`,
    )
    .join('');

  const runDetails = data.runs
    .map(
      (r) => `
      <div class="run-card ${r.error ? 'run-card-error' : ''}">
        <div class="run-card-header">
          <b>${r.providerLabel}</b>
          <span class="scenario-badge">${r.scenarioLabel}</span>
          ${r.error ? '<span class="tag-error">ERROR</span>' : `<span class="tag-score">rubric ${r.rubric.score}/${r.rubric.maxScore}</span>`}
        </div>
        ${r.error ? `<div class="run-error">${escapeHtml(r.error)}</div>` : `<div class="run-text">${escapeHtml(r.text)}</div><ul class="rubric-list">${r.rubric.details.map((d) => `<li>${escapeHtml(d)}</li>`).join('')}</ul>`}
      </div>`,
    )
    .join('');

  return `<!doctype html>
<html lang="th">
<head>
<meta charset="utf-8" />
<title>AI Summary Model Comparison</title>
<style>
  body { font-family: 'Sarabun', 'Segoe UI', sans-serif; background: #f5f7fa; color: #1a1a1a; margin: 0; padding: 24px; }
  h1 { font-size: 20px; }
  .meta { color: #666; font-size: 13px; margin-bottom: 24px; }
  table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  th, td { padding: 10px 14px; text-align: left; font-size: 13px; border-bottom: 1px solid #eee; }
  th { background: #1976d2; color: white; }
  .bar-track { background: #eee; border-radius: 4px; height: 6px; margin-bottom: 4px; overflow: hidden; }
  .bar { height: 100%; border-radius: 4px; }
  .tag-free { background: #4CAF50; color: white; font-size: 10px; padding: 1px 6px; border-radius: 10px; }
  .tag-error { background: #ef4444; color: white; font-size: 10px; padding: 1px 6px; border-radius: 10px; }
  .tag-score { background: #1976d2; color: white; font-size: 10px; padding: 1px 6px; border-radius: 10px; }
  .run-card { background: white; border-radius: 8px; padding: 12px 16px; margin-bottom: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
  .run-card-error { border-left: 4px solid #ef4444; }
  .run-card-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 13px; }
  .scenario-badge { background: #eee; padding: 1px 8px; border-radius: 10px; font-size: 11px; color: #555; }
  .run-text { font-size: 13px; line-height: 1.6; white-space: pre-wrap; background: #fafafa; padding: 8px 10px; border-radius: 6px; }
  .run-error { font-size: 13px; color: #ef4444; }
  .rubric-list { font-size: 11px; color: #555; margin: 8px 0 0; padding-left: 18px; }
  h2 { font-size: 16px; margin-top: 32px; }
</style>
</head>
<body>
  <h1>เปรียบเทียบโมเดล AI สำหรับสรุปผลตรวจบ้านท้ายเล่ม</h1>
  <div class="meta">สร้างเมื่อ ${new Date(data.generatedAt).toLocaleString('th-TH')} — ${data.scenarios.length} สถานการณ์ทดสอบ (${data.scenarios.map((s) => s.label).join(', ')})</div>

  <table>
    <thead><tr><th>Provider</th><th>สำเร็จ/ทั้งหมด</th><th>ความเร็วเฉลี่ย</th><th>Cost เฉลี่ย/ครั้ง (ประมาณการ)</th><th>Rubric เฉลี่ย</th></tr></thead>
    <tbody>${summaryRows}</tbody>
  </table>

  <h2>ผลลัพธ์แต่ละครั้ง (สำหรับอ่านเนื้อหาจริงประกอบการประเมิน)</h2>
  ${runDetails}
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
