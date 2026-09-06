import { Injectable } from '@nestjs/common';
import { LlmProvider } from './llm-provider.interface';
import { ClaudeProvider } from './claude.provider';
import { GeminiProvider } from './gemini.provider';
import { GroqProvider } from './groq.provider';
import { OllamaProvider } from './ollama.provider';

// ลำดับ fallback เริ่มต้นเวลาไม่ได้ตั้ง AI_SUMMARY_PROVIDER ไว้เจาะจง
// Gemini ก่อนเพราะเป็นโมเดล first-party ของ Google เอง lifecycle การเลิกใช้โมเดลชัดเจนกว่า —
// Groq (โฮสต์โมเดล open-weight ของค่ายอื่น เปลี่ยน/เลิกโมเดลบ่อยกว่า) เป็นตัวสำรองที่เร็วมากและฟรีเหมือนกัน
const DEFAULT_PRIORITY = ['gemini', 'groq'];

// pipeline หลักตอนนี้ใช้แค่ Gemini/Groq (ทั้งคู่ฟรี) — Claude ปิดไว้เพราะติด billing,
// Ollama ปิดไว้เพราะเน็ตไม่พอโหลดโมเดล ตัด 'claude'/'ollama' ออกจากลิสต์นี้ก็พอ ไม่ต้องลบโค้ด provider ทิ้ง
// เผื่อวันหลังอยากกลับมาเปิดใช้ใหม่ (แค่เพิ่ม id กลับเข้าลิสต์นี้ ไม่ต้องแก้ที่อื่น)
const ACTIVE_PIPELINE_PROVIDER_IDS = ['gemini', 'groq'];

@Injectable()
export class ProviderRegistryService {
  private readonly providers: LlmProvider[];

  constructor(
    claude: ClaudeProvider,
    gemini: GeminiProvider,
    groq: GroqProvider,
    ollama: OllamaProvider,
  ) {
    this.providers = [claude, gemini, groq, ollama];
  }

  // เฉพาะตัวที่อยู่ใน pipeline หลักและ configured ไว้จริง — ใช้กับ fallback chain อัตโนมัติ
  getConfigured(): LlmProvider[] {
    return this.providers.filter(
      (p) => ACTIVE_PIPELINE_PROVIDER_IDS.includes(p.id) && p.isConfigured(),
    );
  }

  // หาได้ทุกตัวรวมถึงตัวที่ปิดไว้จาก pipeline หลัก — ใช้กับปุ่ม "สร้างสรุปใหม่" แบบ manual เลือก provider เอง
  // (เผื่ออยากลองยิง Claude/Ollama แบบเจาะจงโดยไม่ต้องเปิดกลับเข้า pipeline อัตโนมัติ)
  getById(id: string): LlmProvider | undefined {
    return this.providers.find((p) => p.id === id);
  }

  // ลำดับ provider ที่จะลองสร้างสรุปจริงตอนปิดรอบตรวจ — ถ้าตัวแรกล้มเหลว (error/rate-limit)
  // AiSummaryService จะไล่ลองตัวถัดไปในลิสต์นี้เอง แทนที่จะพึ่ง provider เดียวแล้วล้มเหลวทั้งหมด
  // ตัวที่ตั้งไว้ใน env AI_SUMMARY_PROVIDER (ถ้า configured) จะถูกยกไปเป็นตัวแรกเสมอ
  getFallbackChain(): LlmProvider[] {
    const configured = this.getConfigured();
    const preferredId = process.env.AI_SUMMARY_PROVIDER;

    const preferred = configured.filter((p) => p.id === preferredId);
    const rest = configured
      .filter((p) => p.id !== preferredId)
      .sort(
        (a, b) =>
          DEFAULT_PRIORITY.indexOf(a.id) - DEFAULT_PRIORITY.indexOf(b.id),
      );

    return [...preferred, ...rest];
  }
}
