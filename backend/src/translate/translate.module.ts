import { Module } from '@nestjs/common';
import { TranslateController } from './translate.controller';

// TranslationService มาจาก AiSummaryModule (@Global) จึงไม่ต้อง import
@Module({
  controllers: [TranslateController],
})
export class TranslateModule {}
