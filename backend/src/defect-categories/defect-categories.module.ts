import { Module } from '@nestjs/common';
import { DefectCategoriesService } from './defect-categories.service';
import { DefectCategoriesController } from './defect-categories.controller';
import { DefectCategory } from './entities/defect-category.entity';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';

@Module({
  imports: [TypeOrmModule.forFeature([DefectCategory])],
  controllers: [DefectCategoriesController],
  providers: [DefectCategoriesService],
  exports: [DefectCategoriesService, DefectCategoriesModule],
})
export class DefectCategoriesModule {}
