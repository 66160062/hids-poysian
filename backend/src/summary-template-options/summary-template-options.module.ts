import { Module } from '@nestjs/common';
import { SummaryTemplateOptionsService } from './summary-template-options.service';
import { SummaryTemplateOptionsController } from './summary-template-options.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SummaryTemplateOption } from './entities/summary-template-option.entity';
import { SummaryTemplatesModule } from 'src/summary-templates/summary-templates.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SummaryTemplateOption]),
    SummaryTemplatesModule,
  ],
  controllers: [SummaryTemplateOptionsController],
  providers: [SummaryTemplateOptionsService],
  exports: [SummaryTemplateOptionsService, TypeOrmModule],
})
export class SummaryTemplateOptionsModule {}
