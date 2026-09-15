import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InspectionRound } from 'src/inspection-rounds/entities/inspection-round.entity';
import { Defect } from 'src/defects/entities/defect.entity';
import { InspectionSummaryItem } from 'src/inspection-summary-items/entities/inspection-summary-item.entity';
import { AiSummaryService } from './ai-summary.service';
import { ProviderRegistryService } from './providers/provider-registry.service';
import { ClaudeProvider } from './providers/claude.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { GroqProvider } from './providers/groq.provider';
import { OllamaProvider } from './providers/ollama.provider';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([InspectionRound, Defect, InspectionSummaryItem]),
  ],
  providers: [
    AiSummaryService,
    ProviderRegistryService,
    ClaudeProvider,
    GeminiProvider,
    GroqProvider,
    OllamaProvider,
  ],
  exports: [AiSummaryService],
})
export class AiSummaryModule {}
