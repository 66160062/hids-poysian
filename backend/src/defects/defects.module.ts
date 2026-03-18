import { Module } from '@nestjs/common';
import { DefectsService } from './defects.service';
import { DefectsController } from './defects.controller';
import { Defect } from './entities/defect.entity';
import { DefectSubCategoriesModule } from 'src/defect-sub-categories/defect-sub-categories.module';
import { InspectionRoundsModule } from 'src/inspection-rounds/inspection-rounds.module';
import { UsersModule } from 'src/users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InspectionRound } from 'src/inspection-rounds/entities/inspection-round.entity';
import { DefectSubCategory } from 'src/defect-sub-categories/entities/defect-sub-category.entity';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Defect,
      InspectionRound,
      DefectSubCategory,
      User,
    ]),
    DefectSubCategoriesModule,
    InspectionRoundsModule,
    UsersModule,
  ],
  controllers: [DefectsController],
  providers: [DefectsService],
  exports: [DefectsService],
})
export class DefectsModule {}
