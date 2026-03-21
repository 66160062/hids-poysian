import { Module } from '@nestjs/common';
import { SummaryTemplatesService } from './summary-templates.service';
import { SummaryTemplatesController } from './summary-templates.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SummaryTemplate } from './entities/summary-template.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SummaryTemplate])],
  controllers: [SummaryTemplatesController],
  providers: [SummaryTemplatesService],
  exports: [SummaryTemplatesService, TypeOrmModule],
})
export class SummaryTemplatesModule {}
