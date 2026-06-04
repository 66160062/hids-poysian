import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InspectionRound } from 'src/inspection-rounds/entities/inspection-round.entity';
import { InspectionSummaryItem } from 'src/inspection-summary-items/entities/inspection-summary-item.entity';
import { Repository } from 'typeorm';

@Injectable()
export class DailyReportsService {
  constructor(
    @InjectRepository(InspectionRound)
    private readonly roundsRepo: Repository<InspectionRound>,

    @InjectRepository(InspectionSummaryItem)
    private readonly itemsRepo: Repository<InspectionSummaryItem>,
  ) {}

  async getLatestItemsForClone(id: number) {
    const sourceRound = await this.findLatestRoundByJobId(id);

    if (!sourceRound) {
      throw new NotFoundException('No latest round found for clone');
    }

    const items = await this.itemsRepo.find({
      where: { round: { roundId: sourceRound.roundId } },
      relations: ['template', 'option'],
      order: { itemId: 'ASC' },
    });

    return {
      sourceRound: {
        roundId: sourceRound.roundId,
        roundNumber: sourceRound.roundNumber,
        scheduledDate: sourceRound.scheduledDate,
      },
      items: items.map((item) => ({
        templateId: item.template.templateId,
        optionId: item.option.optionId,
        detailValue: item.detailValue ?? '',
        template: item.template,
        option: item.option,
      })),
    };
  }

  private findLatestRoundByJobId(jobId: number) {
    return this.roundsRepo.findOne({
      where: { job: { jobId } },
      order: {
        roundNumber: 'DESC',
        scheduledDate: 'DESC',
        roundId: 'DESC',
      },
    });
  }
}
