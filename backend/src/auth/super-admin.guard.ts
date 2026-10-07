import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

// ต้องรันหลัง AuthGuard เสมอ (อ่าน request.user ที่ AuthGuard set ไว้)
@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<{ user?: { role?: string } }>();

    const role = request.user?.role;
    if (role !== 'super_admin') {
      throw new ForbiddenException('เฉพาะ Super Admin เท่านั้น');
    }
    return true;
  }
}
