import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityLog } from './entities/activity-log.entity';
import { InspectionRound } from 'src/inspection-rounds/entities/inspection-round.entity';
import { ActivityLogsService } from './activity-logs.service';
import { ActivityLogsController } from './activity-logs.controller';
import { AuthModule } from 'src/auth/auth.module';

// Global เหมือน ReportsModule เพราะ ActivityLogsService ถูก inject เข้าไปเป็น
// side-effect writer ในหลายโมดูล (defects, inspection-rounds, reports) โดยไม่ต้อง
// import ActivityLogsModule ซ้ำในแต่ละที่
@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([ActivityLog, InspectionRound]),
    AuthModule,
  ],
  controllers: [ActivityLogsController],
  providers: [ActivityLogsService],
  exports: [ActivityLogsService],
})
export class ActivityLogsModule {}
