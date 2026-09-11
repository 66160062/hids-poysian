import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from 'src/auth/auth.service';
import { InspectionSummaryItem } from '../entities/inspection-summary-item.entity';

// ใช้กับ route ที่ param เป็น summary item id ตรงๆ (เช่น GET/PATCH/DELETE /inspection-summary-items/:id)
// — resolve item -> round -> job ก่อน แล้วตรวจสิทธิ์แบบเดียวกับ RoundAccessGuard
@Injectable()
export class SummaryItemAccessGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    @InjectRepository(InspectionSummaryItem)
    private readonly itemsRepo: Repository<InspectionSummaryItem>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const itemId = Number(request.params.id);

    const item = await this.itemsRepo.findOne({
      where: { itemId },
      relations: ['round', 'round.job'],
    });
    if (!item?.round?.job) {
      throw new NotFoundException('ไม่พบรายการสรุปนี้');
    }

    request.user = await this.authService.verifyRoundAccess(
      request.headers.authorization,
      request.query?.token,
      item.round,
    );
    return true;
  }
}
