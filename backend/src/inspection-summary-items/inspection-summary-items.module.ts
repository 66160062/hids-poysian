import { Module } from '@nestjs/common';
import { InspectionSummaryItemsService } from './inspection-summary-items.service';
import { InspectionSummaryItemsController } from './inspection-summary-items.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InspectionSummaryItem } from './entities/inspection-summary-item.entity';
import { SummaryTemplatesModule } from 'src/summary-templates/summary-templates.module';
import { SummaryTemplateOptionsModule } from 'src/summary-template-options/summary-template-options.module';
import { InspectionRoundsModule } from 'src/inspection-rounds/inspection-rounds.module';
import { AuthModule } from 'src/auth/auth.module';
import { SummaryItemAccessGuard } from './guards/summary-item-access.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([InspectionSummaryItem]),
    SummaryTemplatesModule,
    SummaryTemplateOptionsModule,
    InspectionRoundsModule,
    AuthModule,
  ],
  controllers: [InspectionSummaryItemsController],
  providers: [InspectionSummaryItemsService, SummaryItemAccessGuard],
  exports: [InspectionSummaryItemsService, TypeOrmModule],
})
export class InspectionSummaryItemsModule {}
