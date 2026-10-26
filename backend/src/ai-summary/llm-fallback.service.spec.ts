import { LlmFallbackService } from './llm-fallback.service';
import { ProviderRegistryService } from './providers/provider-registry.service';

describe('LlmFallbackService', () => {
  let service: LlmFallbackService;
  let registry: { getFallbackChain: jest.Mock };

  beforeEach(() => {
    registry = { getFallbackChain: jest.fn() };
    service = new LlmFallbackService(
      registry as unknown as ProviderRegistryService,
    );
  });

  it('reports whether any provider is configured', () => {
    registry.getFallbackChain.mockReturnValue([]);
    expect(service.hasProviders()).toBe(false);

    registry.getFallbackChain.mockReturnValue([{ id: 'gemini' }]);
    expect(service.hasProviders()).toBe(true);
  });

  it('returns the trimmed text of the first provider that succeeds', async () => {
    registry.getFallbackChain.mockReturnValue([
      {
        id: 'gemini',
        generate: jest.fn().mockResolvedValue({ text: '  hello  ' }),
      },
    ]);

    await expect(service.generate('prompt', 'test')).resolves.toEqual({
      text: 'hello',
      providerId: 'gemini',
    });
  });

  it('falls through to the next provider on an error or an empty answer', async () => {
    const failing = {
      id: 'gemini',
      generate: jest.fn().mockRejectedValue(new Error('rate limited')),
    };
    const empty = {
      id: 'groq',
      generate: jest.fn().mockResolvedValue({ text: '   ' }),
    };
    const working = {
      id: 'ollama',
      generate: jest.fn().mockResolvedValue({ text: 'ok' }),
    };
    registry.getFallbackChain.mockReturnValue([failing, empty, working]);

    await expect(service.generate('prompt', 'test')).resolves.toEqual({
      text: 'ok',
      providerId: 'ollama',
    });
    expect(failing.generate).toHaveBeenCalledWith('prompt');
    expect(empty.generate).toHaveBeenCalledWith('prompt');
  });

  it('returns null when every provider fails or none is configured', async () => {
    registry.getFallbackChain.mockReturnValue([]);
    await expect(service.generate('prompt', 'test')).resolves.toBeNull();

    registry.getFallbackChain.mockReturnValue([
      {
        id: 'gemini',
        generate: jest.fn().mockRejectedValue(new Error('down')),
      },
    ]);
    await expect(service.generate('prompt', 'test')).resolves.toBeNull();
  });
});
