import { Injectable, Logger } from '@nestjs/common';
import { LlmGenerateResult, LlmProvider } from './llm-provider.interface';
import { PROVIDER_TIMEOUT_MS } from './provider-timeout';

// เสียเงินตาม token — ใช้ Anthropic Messages API ตรงๆ ผ่าน fetch ไม่ต้องพึ่ง SDK
@Injectable()
export class ClaudeProvider implements LlmProvider {
  readonly id = 'claude';
  readonly label = 'Claude (Anthropic)';
  readonly isFree = false;

  private readonly logger = new Logger(ClaudeProvider.name);
  private readonly apiKey = process.env.ANTHROPIC_API_KEY;
  private readonly model =
    process.env.ANTHROPIC_MODEL ?? 'claude-haiku-4-5-20251001';

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async generate(prompt: string): Promise<LlmGenerateResult> {
    const start = Date.now();
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': this.apiKey ?? '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    });

    if (!response.ok) {
      const body = await response.text();
      this.logger.error(`Claude API error ${response.status}: ${body}`);
      throw new Error(`Claude API error ${response.status}`);
    }

    const data = (await response.json()) as {
      content: { type: string; text: string }[];
      usage: { input_tokens: number; output_tokens: number };
    };

    return {
      text: data.content.find((c) => c.type === 'text')?.text ?? '',
      latencyMs: Date.now() - start,
      promptTokens: data.usage?.input_tokens ?? null,
      completionTokens: data.usage?.output_tokens ?? null,
    };
  }
}
