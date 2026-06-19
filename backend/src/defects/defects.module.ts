import { Module } from '@nestjs/common';
import { DefectsService } from './defects.service';
import { DefectsController } from './defects.controller';
import { Defect } from './entities/defect.entity';
import { DefectSubCategoriesModule } from 'src/defect-sub-categories/defect-sub-categories.module';
import { InspectionRoundsModule } from 'src/inspection-rounds/inspection-rounds.module';
import { UsersModule } from 'src/users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([Defect]),
    DefectSubCategoriesModule,
    InspectionRoundsModule,
    UsersModule,
  ],
  controllers: [DefectsController],
  providers: [DefectsService],
  exports: [DefectsService],
})
export class DefectsModule {}
