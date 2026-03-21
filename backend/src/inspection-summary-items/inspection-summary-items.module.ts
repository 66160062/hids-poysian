import { Module } from '@nestjs/common';
import { InspectionSummaryItemsService } from './inspection-summary-items.service';
import { InspectionSummaryItemsController } from './inspection-summary-items.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InspectionSummaryItem } from './entities/inspection-summary-item.entity';
import { SummaryTemplatesModule } from 'src/summary-templates/summary-templates.module';
import { SummaryTemplateOptionsModule } from 'src/summary-template-options/summary-template-options.module';
import { InspectionRoundsModule } from 'src/inspection-rounds/inspection-rounds.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([InspectionSummaryItem]),
    SummaryTemplatesModule,
    SummaryTemplateOptionsModule,
    InspectionRoundsModule,
  ],
  controllers: [InspectionSummaryItemsController],
  providers: [InspectionSummaryItemsService],
  exports: [InspectionSummaryItemsService, TypeOrmModule],
})
export class InspectionSummaryItemsModule {}
