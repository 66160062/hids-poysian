import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from './auth.service';
import { InspectionRound } from 'src/inspection-rounds/entities/inspection-round.entity';

// ใช้กับ route ที่ param เป็น roundId (เช่น GET /defects/round/:roundId,
// GET /inspection-summary-items/round/:roundId, GET /inspection-rounds/:id) — resolve
// roundId -> jobId ของมันก่อน แล้วตรวจสิทธิ์แบบเดียวกับ JobAccessGuard
@Injectable()
export class RoundAccessGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    @InjectRepository(InspectionRound)
    private readonly roundsRepo: Repository<InspectionRound>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const roundId = Number(request.params.roundId ?? request.params.id);

    const round = await this.roundsRepo.findOne({
      where: { roundId },
      relations: ['job'],
    });
    if (!round?.job) {
      throw new NotFoundException('ไม่พบรอบตรวจนี้');
    }

    request.user = await this.authService.verifyJobAccess(
      request.headers.authorization,
      request.query?.token,
      round.job.jobId,
    );
    return true;
  }
}
