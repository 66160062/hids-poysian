import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

// ต้องรันหลัง AuthGuard เสมอ (อ่าน request.user ที่ AuthGuard set ไว้)
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<{ user?: { role?: string } }>();

    const role = request.user?.role;
    if (role !== 'admin' && role !== 'super_admin') {
      throw new ForbiddenException('เฉพาะผู้ดูแลระบบเท่านั้น');
    }
    return true;
  }
}
