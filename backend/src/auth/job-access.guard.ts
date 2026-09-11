import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthService } from './auth.service';

// ใช้กับ route ที่ jobId/id ใน param คือ jobId ตรงๆ (เช่น GET /inspection-jobs/:id,
// GET /daily-reports/:id/rounds, GET /activity-logs/:jobId) — อนุญาต staff (Bearer) เสมอ
// หรือลิงก์ (?token=) ที่ project_id ตรงกับ jobId ที่ขอเท่านั้น
@Injectable()
export class JobAccessGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const jobId = Number(request.params.jobId ?? request.params.id);

    request.user = await this.authService.verifyJobAccess(
      request.headers.authorization,
      request.query?.token,
      jobId,
    );
    return true;
  }
}
