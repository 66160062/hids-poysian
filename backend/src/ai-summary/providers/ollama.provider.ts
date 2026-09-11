import { Injectable, Logger } from '@nestjs/common';
import { LlmGenerateResult, LlmProvider } from './llm-provider.interface';
import { OLLAMA_TIMEOUT_MS } from './provider-timeout';

// รันโมเดล open-source บนเครื่องตัวเองผ่าน Ollama (https://ollama.com) — ฟรี 100% ไม่ต้องมี API key
// แต่ต้องติดตั้ง Ollama และ pull โมเดล (เช่น `ollama pull llama3.2`) ไว้ก่อน แล้วรัน `ollama serve`
// ตั้งค่า OLLAMA_MODEL ใน .env เพื่อเปิดใช้ provider นี้ (ถ้าไม่ตั้งจะถือว่าไม่ได้ configure ไว้)
@Injectable()
export class OllamaProvider implements LlmProvider {
  readonly id = 'ollama';
  readonly label = 'Ollama (local, free)';
  readonly isFree = true;

  private readonly logger = new Logger(OllamaProvider.name);
  private readonly baseUrl =
    process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';
  private readonly model = process.env.OLLAMA_MODEL;

  isConfigured(): boolean {
    return !!this.model;
  }

  async generate(prompt: string): Promise<LlmGenerateResult> {
    const start = Date.now();
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        stream: false,
      }),
      signal: AbortSignal.timeout(OLLAMA_TIMEOUT_MS),
    });

    if (!response.ok) {
      const body = await response.text();
      this.logger.error(`Ollama API error ${response.status}: ${body}`);
      throw new Error(`Ollama API error ${response.status}`);
    }

    const data = (await response.json()) as {
      message: { content: string };
      prompt_eval_count?: number;
      eval_count?: number;
    };

    return {
      text: data.message?.content ?? '',
      latencyMs: Date.now() - start,
      promptTokens: data.prompt_eval_count ?? null,
      completionTokens: data.eval_count ?? null,
    };
  }
}
