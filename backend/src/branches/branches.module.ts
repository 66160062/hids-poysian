import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { Branch } from './entities/branch.entity';
import { Team } from 'src/teams/entities/team.entity';
import { BranchesController } from './branches.controller';
import { BranchesService } from './branches.service';

@Module({ imports: [TypeOrmModule.forFeature([Branch, Team]), AuthModule], controllers: [BranchesController], providers: [BranchesService], exports: [BranchesService, TypeOrmModule] })
export class BranchesModule {}
