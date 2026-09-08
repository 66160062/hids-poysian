import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PdfService } from './pdf.service';
import { Defect } from 'src/defects/entities/defect.entity';
import { InspectionSummaryItem } from 'src/inspection-summary-items/entities/inspection-summary-item.entity';
import { InspectionRound } from 'src/inspection-rounds/entities/inspection-round.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Defect, InspectionSummaryItem, InspectionRound]),
  ],
  providers: [PdfService],
  exports: [PdfService],
})
export class PdfModule {}
