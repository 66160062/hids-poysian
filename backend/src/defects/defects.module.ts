import { Module } from '@nestjs/common';
import { DefectsService } from './defects.service';
import { DefectsController } from './defects.controller';
import { Defect } from './entities/defect.entity';
import { Room } from 'src/rooms/entities/room.entity';
import { SubRoom } from 'src/sub-rooms/entities/sub-room.entity';
import { DefectSubCategoriesModule } from 'src/defect-sub-categories/defect-sub-categories.module';
import { InspectionRoundsModule } from 'src/inspection-rounds/inspection-rounds.module';
import { UsersModule } from 'src/users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { DefectAccessGuard } from './guards/defect-access.guard';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Defect, Room, SubRoom]),
    DefectSubCategoriesModule,
    InspectionRoundsModule,
    UsersModule,
    AuthModule,
    NotificationsModule,
  ],
  controllers: [DefectsController],
  providers: [DefectsService, DefectAccessGuard],
  exports: [DefectsService],
})
export class DefectsModule {}
