import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

// ใช้กับ route ที่มี :inspectorId ใน param (เช่น GET /inspection-rounds/week/:inspectorId,
// GET /inspection-rounds/month/:inspectorId) — ต้องรันหลัง AuthGuard เสมอ (ใช้ request.user
// ที่ AuthGuard set ไว้) — inspector ดูได้เฉพาะตารางของตัวเอง ส่วน role อื่น (เช่น admin) ดูของใครก็ได้
@Injectable()
export class InspectorSelfOrAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const inspectorId = Number(request.params.inspectorId);
    const user = request.user as { sub?: number; role?: string } | undefined;

    if (user?.role === 'inspector' && Number(user.sub) !== inspectorId) {
      throw new ForbiddenException('คุณไม่มีสิทธิ์ดูตารางของผู้ตรวจคนอื่น');
    }
    return true;
  }
}
