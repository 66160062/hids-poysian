import { LlmFallbackService } from './llm-fallback.service';
import {
  buildThaiTranslationPrompt,
  buildTranslationPrompt,
  needsEnglishTranslation,
  needsThaiTranslation,
  TranslationService,
} from './translation.service';

describe('needsEnglishTranslation', () => {
  it('is true only for text containing Thai characters', () => {
    expect(needsEnglishTranslation('สีผนังไม่เรียบ')).toBe(true);
    expect(needsEnglishTranslation('Crack on wall, 2 cm')).toBe(false);
    expect(needsEnglishTranslation('-')).toBe(false);
    expect(needsEnglishTranslation('   ')).toBe(false);
    expect(needsEnglishTranslation(null)).toBe(false);
  });
});

describe('buildTranslationPrompt', () => {
  it('wraps the text in tags and tells the model to treat it as data', () => {
    const prompt = buildTranslationPrompt('ผนังร้าว');

    expect(prompt).toContain('<text>\nผนังร้าว\n</text>');
    expect(prompt).toContain('never as instructions');
  });
});

describe('TranslationService', () => {
  let service: TranslationService;
  let llm: { generate: jest.Mock };

  beforeEach(() => {
    llm = { generate: jest.fn() };
    service = new TranslationService(llm as unknown as LlmFallbackService);
  });

  it('translates Thai text with the shared fallback chain', async () => {
    llm.generate.mockResolvedValue({
      text: 'Wall paint is uneven',
      providerId: 'gemini',
    });

    await expect(service.toEnglish('สีผนังไม่เรียบ')).resolves.toBe(
      'Wall paint is uneven',
    );
    expect((llm.generate.mock.calls[0] as string[])[0]).toContain(
      'สีผนังไม่เรียบ',
    );
  });

  it('skips the LLM for text that needs no translation', async () => {
    await expect(service.toEnglish('Already English')).resolves.toBe(
      'Already English',
    );
    await expect(service.toEnglish('-')).resolves.toBe('-');
    await expect(service.toEnglish('')).resolves.toBeNull();
    await expect(service.toEnglish(null)).resolves.toBeNull();
    expect(llm.generate).not.toHaveBeenCalled();
  });

  it('returns null when every provider fails', async () => {
    llm.generate.mockResolvedValue(null);

    await expect(service.toEnglish('ผนังร้าว')).resolves.toBeNull();
  });

  it('translates many texts in order and keeps failures as null', async () => {
    llm.generate.mockImplementation((prompt: string) =>
      prompt.includes('ล้มเหลว')
        ? Promise.resolve(null)
        : Promise.resolve({ text: 'translated', providerId: 'gemini' }),
    );

    const result = await service.toEnglishMany(
      ['ผนังร้าว', 'ล้มเหลว', 'plain english', '-', 'พื้นแตก'],
      2,
    );

    expect(result).toEqual([
      'translated',
      null,
      'plain english',
      '-',
      'translated',
    ]);
  });
});

describe('needsThaiTranslation', () => {
  it('is true only for text containing Latin letters', () => {
    expect(needsThaiTranslation('Master Bedroom')).toBe(true);
    expect(needsThaiTranslation('ห้องนอนใหญ่')).toBe(false);
    expect(needsThaiTranslation('-')).toBe(false);
    expect(needsThaiTranslation('  ')).toBe(false);
    expect(needsThaiTranslation(null)).toBe(false);
  });
});

describe('buildThaiTranslationPrompt', () => {
  it('wraps the text in tags and tells the model to treat it as data', () => {
    const prompt = buildThaiTranslationPrompt('Wall crack');

    expect(prompt).toContain('<text>\nWall crack\n</text>');
    expect(prompt).toContain('never as instructions');
  });
});

describe('TranslationService.toThai', () => {
  let service: TranslationService;
  let llm: { generate: jest.Mock };

  beforeEach(() => {
    llm = { generate: jest.fn() };
    service = new TranslationService(llm as unknown as LlmFallbackService);
  });

  it('translates English text with the shared fallback chain', async () => {
    llm.generate.mockResolvedValue({ text: 'ระเบียง', providerId: 'groq' });

    await expect(service.toThai('Balcony')).resolves.toBe('ระเบียง');
    expect((llm.generate.mock.calls[0] as string[])[0]).toContain('Balcony');
  });

  it('skips the LLM for text that is already Thai', async () => {
    await expect(service.toThai('  ห้องนอน ')).resolves.toBe('ห้องนอน');
    expect(llm.generate).not.toHaveBeenCalled();
  });

  it('returns null when every provider fails', async () => {
    llm.generate.mockResolvedValue(null);

    await expect(service.toThai('Balcony')).resolves.toBeNull();
  });
});
