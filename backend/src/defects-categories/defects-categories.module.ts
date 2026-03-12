import { Module } from '@nestjs/common';
import { DefectsCategoriesService } from './defects-categories.service';
import { DefectsCategoriesController } from './defects-categories.controller';
import { DefectsCategory } from './entities/defects-category.entity';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';

@Module({
  imports: [TypeOrmModule.forFeature([DefectsCategory])],
  controllers: [DefectsCategoriesController],
  providers: [DefectsCategoriesService],
  exports: [DefectsCategoriesService],
})
export class DefectsCategoriesModule {}
