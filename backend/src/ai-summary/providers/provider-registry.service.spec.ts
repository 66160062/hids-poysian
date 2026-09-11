import { ProviderRegistryService } from './provider-registry.service';
import { LlmProvider } from './llm-provider.interface';
import { ClaudeProvider } from './claude.provider';
import { GeminiProvider } from './gemini.provider';
import { GroqProvider } from './groq.provider';
import { OllamaProvider } from './ollama.provider';

function fakeProvider(id: string, configured: boolean): LlmProvider {
  return {
    id,
    label: id,
    isFree: false,
    isConfigured: () => configured,
    generate: jest.fn(),
  };
}

describe('ProviderRegistryService', () => {
  const originalEnv = process.env.AI_SUMMARY_PROVIDER;

  afterEach(() => {
    if (originalEnv === undefined) delete process.env.AI_SUMMARY_PROVIDER;
    else process.env.AI_SUMMARY_PROVIDER = originalEnv;
  });

  function build(
    configuredIds: Record<'claude' | 'gemini' | 'groq' | 'ollama', boolean>,
  ) {
    return new ProviderRegistryService(
      fakeProvider('claude', configuredIds.claude) as ClaudeProvider,
      fakeProvider('gemini', configuredIds.gemini) as unknown as GeminiProvider,
      fakeProvider('groq', configuredIds.groq) as unknown as GroqProvider,
      fakeProvider('ollama', configuredIds.ollama) as unknown as OllamaProvider,
    );
  }

  describe('getConfigured', () => {
    it('returns only Gemini/Groq, even when Claude and Ollama are also configured', () => {
      const registry = build({
        claude: true,
        gemini: true,
        groq: true,
        ollama: true,
      });

      expect(registry.getConfigured().map((p) => p.id)).toEqual([
        'gemini',
        'groq',
      ]);
    });

    it('excludes Claude and Ollama from the pipeline even though they are still configured', () => {
      // pipeline หลักตอนนี้ตัด claude/ollama ออกโดยตั้งใจ (ติด billing / เน็ตไม่พอโหลดโมเดล)
      // ไม่เกี่ยวกับว่า isConfigured() ของมันจะ true หรือ false
      const registry = build({
        claude: true,
        gemini: false,
        groq: false,
        ollama: true,
      });

      expect(registry.getConfigured()).toEqual([]);
    });
  });

  describe('getById', () => {
    it('still finds Claude and Ollama by id even though they are outside the active pipeline', () => {
      // ใช้กับปุ่ม "สร้างสรุปใหม่" แบบ manual — เลือกยิง provider ที่ปิดไว้จาก pipeline อัตโนมัติได้โดยเจาะจง
      const registry = build({
        claude: true,
        gemini: true,
        groq: true,
        ollama: true,
      });

      expect(registry.getById('claude')?.id).toBe('claude');
      expect(registry.getById('ollama')?.id).toBe('ollama');
    });
  });

  describe('getFallbackChain', () => {
    it('puts AI_SUMMARY_PROVIDER first when that provider is configured and in the active pipeline', () => {
      process.env.AI_SUMMARY_PROVIDER = 'groq';
      const registry = build({
        claude: true,
        gemini: true,
        groq: true,
        ollama: false,
      });

      expect(registry.getFallbackChain().map((p) => p.id)).toEqual([
        'groq',
        'gemini',
      ]);
    });

    it('falls back to the default priority order (gemini, groq) when AI_SUMMARY_PROVIDER is unset', () => {
      delete process.env.AI_SUMMARY_PROVIDER;
      const registry = build({
        claude: true,
        gemini: true,
        groq: true,
        ollama: true,
      });

      expect(registry.getFallbackChain().map((p) => p.id)).toEqual([
        'gemini',
        'groq',
      ]);
    });

    it('ignores AI_SUMMARY_PROVIDER when it names a provider outside the active pipeline (e.g. claude)', () => {
      process.env.AI_SUMMARY_PROVIDER = 'claude';
      const registry = build({
        claude: true,
        gemini: false,
        groq: true,
        ollama: false,
      });

      expect(registry.getFallbackChain().map((p) => p.id)).toEqual(['groq']);
    });

    it('returns an empty array when no provider in the active pipeline is configured', () => {
      delete process.env.AI_SUMMARY_PROVIDER;
      const registry = build({
        claude: true,
        gemini: false,
        groq: false,
        ollama: true,
      });

      expect(registry.getFallbackChain()).toEqual([]);
    });
  });
});
