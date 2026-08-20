import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { AuthGuard } from 'src/auth/auth.guard';

interface AuthedRequest {
  user: { sub: number; role: string };
}

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'ดึงรายการแจ้งเตือนของผู้ใช้ที่ล็อกอินอยู่' })
  findMine(@Req() req: AuthedRequest) {
    if (req.user.role === 'admin') {
      return this.notificationsService.findForRole('admin');
    }
    return this.notificationsService.findForUser(req.user.sub);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'ทำเครื่องหมายอ่าน/ยังไม่อ่าน' })
  setRead(
    @Param('id', ParseIntPipe) id: number,
    @Body('isRead') isRead: boolean,
  ) {
    return this.notificationsService.setRead(id, isRead ?? true);
  }

  @Patch('mark-all-read')
  @ApiOperation({ summary: 'ทำเครื่องหมายอ่านทั้งหมด' })
  markAllRead(@Req() req: AuthedRequest) {
    const role = req.user.role === 'admin' ? 'admin' : req.user.role;
    return this.notificationsService.markAllReadForRole(role);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'ลบการแจ้งเตือน' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.notificationsService.remove(id);
  }
}
