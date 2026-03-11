import { Module } from '@nestjs/common';
import { HouseTypesService } from './house-types.service';
import { HouseTypesController } from './house-types.controller';
import { HouseType } from './entities/house-type.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([HouseType])],
  controllers: [HouseTypesController],
  providers: [HouseTypesService],
  exports: [HouseTypesService],
})
export class HouseTypesModule {}
