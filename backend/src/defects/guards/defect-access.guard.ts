import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from 'src/auth/auth.service';
import { Defect } from '../entities/defect.entity';

// ใช้กับ route ที่ param เป็น defect id ตรงๆ (เช่น GET/PATCH/DELETE /defects/:id) —
// resolve defect -> round -> job ก่อน แล้วตรวจสิทธิ์แบบเดียวกับ RoundAccessGuard
@Injectable()
export class DefectAccessGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    @InjectRepository(Defect)
    private readonly defectsRepo: Repository<Defect>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const defectId = Number(request.params.id);

    const defect = await this.defectsRepo.findOne({
      where: { defectId },
      relations: ['round', 'round.job'],
    });
    if (!defect?.round?.job) {
      throw new NotFoundException('ไม่พบข้อมูล defect นี้');
    }

    request.user = await this.authService.verifyRoundAccess(
      request.headers.authorization,
      request.query?.token,
      defect.round,
    );
    return true;
  }
}
