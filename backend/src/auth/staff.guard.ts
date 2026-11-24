import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

const STAFF_ROLES = ['inspector', 'admin', 'super_admin'];

// ต้องรันหลัง AuthGuard เสมอ (อ่าน request.user ที่ AuthGuard set ไว้)
// link token ของ customer/contractor เซ็นด้วย secret เดียวกับ JWT พนักงาน จึงผ่าน AuthGuard ได้
// guard นี้กันให้เฉพาะพนักงาน (inspector/admin) เข้าถึงข้อมูลภายใน
@Injectable()
export class StaffGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<{ user?: { role?: string } }>();

    const role = request.user?.role;
    if (!role || !STAFF_ROLES.includes(role)) {
      throw new ForbiddenException('เฉพาะพนักงานเท่านั้น');
    }
    return true;
  }
}
