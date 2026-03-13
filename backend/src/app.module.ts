import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { User } from './users/entities/user.entity';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { InspectionJobsModule } from './inspection-jobs/inspection-jobs.module';
import { InspectionJob } from './inspection-jobs/entities/inspection-job.entity';
import { CustomersModule } from './customers/customers.module';
import { Customer } from './customers/entities/customer.entity';
import { AddressesModule } from './addresses/addresses.module';
import { Address } from './addresses/entities/address.entity';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { HouseTypesModule } from './house-types/house-types.module';
import { HouseType } from './house-types/entities/house-type.entity';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { DefectsModule } from './defects/defects.module';
import { DefectsSubCategoriesModule } from './defects-sub-categories/defects-sub-categories.module';
import { DefectsCategoriesModule } from './defects-categories/defects-categories.module';
import { Inspector } from './inspectors/entities/inspector.entity';
import { InspectorsModule } from './inspectors/inspectors.module';
import { InspectionTeamMembersModule } from './inspection-team-members/inspection-team-members.module';
import { InspectionTeamMember } from './inspection-team-members/entities/inspection-team-member.entity';
import { TeamsModule } from './teams/teams.module';
import { Team } from './teams/entities/team.entity';
import { ContractorModule } from './contractor/contractor.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'hids.db',
      entities: [
        User,
        InspectionJob,
        Customer,
        Address,
        HouseType,
        Inspector,
        InspectionTeamMember,
        Team,
      ],
      synchronize: true,
      namingStrategy: new SnakeNamingStrategy(),
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    AuthModule,
    UsersModule,
    InspectionJobsModule,
    CustomersModule,
    AddressesModule,
    HouseTypesModule,
    DefectsModule,
    DefectsSubCategoriesModule,
    DefectsCategoriesModule,
    InspectorsModule,
    InspectionTeamMembersModule,
    TeamsModule,
    ContractorModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
