export interface LlmGenerateResult {
  text: string;
  latencyMs: number;
  promptTokens: number | null;
  completionTokens: number | null;
}

export interface LlmProvider {
  readonly id: string;
  readonly label: string;
  readonly isFree: boolean;
  isConfigured(): boolean;
  generate(prompt: string): Promise<LlmGenerateResult>;
}
