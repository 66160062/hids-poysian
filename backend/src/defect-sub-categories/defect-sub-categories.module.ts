import { Module } from '@nestjs/common';
import { DefectSubCategoriesService } from './defect-sub-categories.service';
import { DefectSubCategoriesController } from './defect-sub-categories.controller';
import { DefectSubCategory } from './entities/defect-sub-category.entity';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';
import { DefectCategoriesModule } from 'src/defect-categories/defect-categories.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DefectSubCategory]),
    DefectCategoriesModule,
  ],
  controllers: [DefectSubCategoriesController],
  providers: [DefectSubCategoriesService],
  exports: [DefectSubCategoriesService, DefectSubCategoriesModule],
})
export class DefectSubCategoriesModule {}
