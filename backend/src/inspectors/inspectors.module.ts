import { Module } from '@nestjs/common';
import { InspectorsService } from './inspectors.service';
import { InspectorsController } from './inspectors.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inspector } from './entities/inspector.entity';
import { TeamsModule } from 'src/teams/teams.module';

@Module({
  imports: [TypeOrmModule.forFeature([Inspector]), TeamsModule],
  controllers: [InspectorsController],
  providers: [InspectorsService],
  exports: [InspectorsService, TypeOrmModule],
})
export class InspectorsModule {}
