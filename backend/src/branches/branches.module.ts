import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { Branch } from './entities/branch.entity';
import { BranchesController } from './branches.controller';
import { BranchesService } from './branches.service';

@Module({
  imports: [TypeOrmModule.forFeature([Branch]), AuthModule],
  controllers: [BranchesController],
  providers: [BranchesService],
  exports: [BranchesService, TypeOrmModule],
})
export class BranchesModule {}
