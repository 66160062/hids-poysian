import { Injectable, Logger } from '@nestjs/common';
import { LlmGenerateResult, LlmProvider } from './llm-provider.interface';
import { PROVIDER_TIMEOUT_MS } from './provider-timeout';

// Google AI Studio ออก API key ฟรีได้ (มี free tier / rate limit ต่ำ) — ใช้ Generative Language API ตรงๆ
@Injectable()
export class GeminiProvider implements LlmProvider {
  readonly id = 'gemini';
  readonly label = 'Gemini (Google)';
  readonly isFree = true;

  private readonly logger = new Logger(GeminiProvider.name);
  private readonly apiKey = process.env.GEMINI_API_KEY;
  private readonly model = process.env.GEMINI_MODEL ?? 'gemini-3.6-flash';

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async generate(prompt: string): Promise<LlmGenerateResult> {
    const start = Date.now();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    });

    if (!response.ok) {
      const body = await response.text();
      this.logger.error(`Gemini API error ${response.status}: ${body}`);
      throw new Error(`Gemini API error ${response.status}`);
    }

    const data = (await response.json()) as {
      candidates: { content: { parts: { text: string }[] } }[];
      usageMetadata?: {
        promptTokenCount: number;
        candidatesTokenCount: number;
      };
    };

    return {
      text: data.candidates?.[0]?.content?.parts?.[0]?.text ?? '',
      latencyMs: Date.now() - start,
      promptTokens: data.usageMetadata?.promptTokenCount ?? null,
      completionTokens: data.usageMetadata?.candidatesTokenCount ?? null,
    };
  }
}
