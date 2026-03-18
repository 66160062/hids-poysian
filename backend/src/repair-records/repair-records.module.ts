import { Module } from '@nestjs/common';
import { RepairRecordsService } from './repair-records.service';
import { RepairRecordsController } from './repair-records.controller';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';
import { RepairRecord } from './entities/repair-record.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RepairRecord])],
  controllers: [RepairRecordsController],
  providers: [RepairRecordsService],
  exports: [RepairRecordsService],
})
export class RepairRecordsModule {}
