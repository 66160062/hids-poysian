import { Injectable, Logger } from '@nestjs/common';
import { ProviderRegistryService } from './providers/provider-registry.service';

export interface LlmFallbackResult {
  text: string;
  providerId: string;
}

// ไล่ลอง LLM provider ตาม fallback chain ทีละตัว — ตัวไหน error/rate-limit/ตอบว่างก็ข้ามไปตัวถัดไปทันที
// แยกออกมาเป็นบริการกลางเพื่อให้ทั้งสรุปผลตรวจและการแปลหมายเหตุใช้กลไกสำรองชุดเดียวกัน
@Injectable()
export class LlmFallbackService {
  private readonly logger = new Logger(LlmFallbackService.name);

  constructor(private readonly providerRegistry: ProviderRegistryService) {}

  hasProviders(): boolean {
    return this.providerRegistry.getFallbackChain().length > 0;
  }

  // คืน null เมื่อไม่มี provider ที่ configure ไว้ หรือทุกตัวใน chain ล้มเหลว (ผู้เรียกตัดสินใจเองว่าจะรับมืออย่างไร)
  async generate(
    prompt: string,
    context: string,
  ): Promise<LlmFallbackResult | null> {
    for (const provider of this.providerRegistry.getFallbackChain()) {
      try {
        const result = await provider.generate(prompt);
        const text = result.text.trim();
        // reasoning model บางตัว (เช่น gpt-oss ผ่าน Groq) คืนข้อความว่างเปล่าเมื่อ token หมดตอน reasoning
        // ถือเป็นความล้มเหลว ไม่งั้นจะบันทึกข้อความเปล่าลงรายงานที่ส่งให้ลูกค้า
        if (!text) {
          throw new Error('ได้ข้อความว่างเปล่ากลับมา');
        }
        return { text, providerId: provider.id };
      } catch (error) {
        this.logger.warn(
          `${context}: ${provider.id} ล้มเหลว ลอง provider ถัดไปใน fallback chain`,
          error instanceof Error ? error.message : String(error),
        );
      }
    }
    return null;
  }
}
