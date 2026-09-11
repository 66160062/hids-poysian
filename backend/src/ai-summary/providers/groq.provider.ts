import { Injectable, Logger } from '@nestjs/common';
import { LlmGenerateResult, LlmProvider } from './llm-provider.interface';
import { PROVIDER_TIMEOUT_MS } from './provider-timeout';

// Groq มี free tier ให้เรียก open-weight model แบบเร็วมาก ผ่าน endpoint ที่เข้ากันได้กับ OpenAI chat completions
// รายชื่อโมเดลที่ใช้ได้เปลี่ยนบ่อย เช็คของจริงได้ที่ GET https://api.groq.com/openai/v1/models (ใช้ API key ยิงดู)
@Injectable()
export class GroqProvider implements LlmProvider {
  readonly id = 'groq';
  readonly label = 'Groq (open models)';
  readonly isFree = true;

  private readonly logger = new Logger(GroqProvider.name);
  private readonly apiKey = process.env.GROQ_API_KEY;
  private readonly model = process.env.GROQ_MODEL ?? 'openai/gpt-oss-20b';

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async generate(prompt: string): Promise<LlmGenerateResult> {
    const start = Date.now();
    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: prompt }],
          // gpt-oss เป็น reasoning model ที่กิน token ส่วนหนึ่งไปกับ reasoning ก่อนตอบจริง
          // ถ้า reasoning ยาวจน token หมดก่อน จะได้ข้อความว่างเปล่ากลับมา —
          // งานสรุปนี้ไม่ต้องคิดซับซ้อน (ตัวเลขคำนวณมาให้หมดแล้ว) จึงสั่ง reasoning ระดับต่ำ
          // และเผื่อ max_tokens ไว้มากพอสำหรับกรณีที่ prompt ยาว (มีรายการตรวจระบบเยอะ)
          reasoning_effort: 'low',
          max_tokens: 2048,
        }),
        signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
      },
    );

    if (!response.ok) {
      const body = await response.text();
      this.logger.error(`Groq API error ${response.status}: ${body}`);
      throw new Error(`Groq API error ${response.status}`);
    }

    const data = (await response.json()) as {
      choices: { message: { content: string } }[];
      usage: { prompt_tokens: number; completion_tokens: number };
    };

    return {
      text: data.choices?.[0]?.message?.content ?? '',
      latencyMs: Date.now() - start,
      promptTokens: data.usage?.prompt_tokens ?? null,
      completionTokens: data.usage?.completion_tokens ?? null,
    };
  }
}
