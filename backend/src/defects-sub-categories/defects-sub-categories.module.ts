import { Module } from '@nestjs/common';
import { DefectsSubCategoriesService } from './defects-sub-categories.service';
import { DefectsSubCategoriesController } from './defects-sub-categories.controller';
import { DefectsSubCategory } from './entities/defects-sub-category.entity';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';

@Module({
  imports: [TypeOrmModule.forFeature([DefectsSubCategory])],
  controllers: [DefectsSubCategoriesController],
  providers: [DefectsSubCategoriesService],
  exports: [DefectsSubCategoriesService],
})
export class DefectsSubCategoriesModule {}
