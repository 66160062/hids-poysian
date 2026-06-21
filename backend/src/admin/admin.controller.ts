import { Controller, Get, Query, Post } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { DashboardResponse } from './dto/dashboard-response.dto';
import { WorkListResponse } from './dto/work-list-response.dto';

/**
 * AdminController — จัดการเส้นทาง HTTP สำหรับระบบ Admin
 *
 * ⚠️ ตาม Skill: Controller ทำหน้าที่ routing เท่านั้น
 *    Logic ทั้งหมดอยู่ใน AdminService
 */
@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'ดึงข้อมูลสถิติสำหรับ Admin Dashboard' })
  @ApiQuery({
    name: 'date',
    required: false,
    description: 'วันที่ (ISO format) สำหรับเลือกเดือนปฏิทิน เช่น 2026-06-01',
  })
  getDashboard(@Query('date') dateString?: string): Promise<DashboardResponse> {
    return this.adminService.getDashboardData(dateString);
  }

  @Post('sync-jobs')
  @ApiOperation({ summary: 'Sync สถานะงานจากระบบภายนอก' })
  syncJobs() {
    return this.adminService.syncJobStatuses();
  }

  @Get('jobs')
  @ApiOperation({
    summary: 'ดึงข้อมูลรายการงานทั้งหมดสำหรับหน้า Admin Work List',
  })
  getWorkList(): Promise<WorkListResponse> {
    return this.adminService.getAllWorkList();
  }
}
