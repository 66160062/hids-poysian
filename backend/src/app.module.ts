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
import { DefectSubCategoriesModule } from './defect-sub-categories/defect-sub-categories.module';
import { DefectCategoriesModule } from './defect-categories/defect-categories.module';
import { InspectionTeamMembersModule } from './inspection-team-members/inspection-team-members.module';
import { InspectionTeamMember } from './inspection-team-members/entities/inspection-team-member.entity';
import { TeamsModule } from './teams/teams.module';
import { Team } from './teams/entities/team.entity';
import { ContractorModule } from './contractor/contractor.module';
import { RepairRecordsModule } from './repair-records/repair-records.module';
import { InspectionRoundsModule } from './inspection-rounds/inspection-rounds.module';
import { InspectionRound } from './inspection-rounds/entities/inspection-round.entity';
import { DefectCategory } from './defect-categories/entities/defect-category.entity';
import { DefectSubCategory } from './defect-sub-categories/entities/defect-sub-category.entity';
import { RepairRecord } from './repair-records/entities/repair-record.entity';
import { Contractor } from './contractor/entities/contractor.entity';
import { Defect } from './defects/entities/defect.entity';
import { RoomTemplatesModule } from './room-templates/room-templates.module';
import { RoomTemplate } from './room-templates/entities/room-template.entity';
import { SummaryTemplateOptionsModule } from './summary-template-options/summary-template-options.module';
import { SummaryTemplateOption } from './summary-template-options/entities/summary-template-option.entity';
import { SummaryTemplatesModule } from './summary-templates/summary-templates.module';
import { SummaryTemplate } from './summary-templates/entities/summary-template.entity';
import { InspectionSummaryItemsModule } from './inspection-summary-items/inspection-summary-items.module';
import { InspectionSummaryItem } from './inspection-summary-items/entities/inspection-summary-item.entity';
import { FloorModule } from './floor/floor.module';
import { SubRoomsModule } from './sub-rooms/sub-rooms.module';
import { Floor } from './floor/entities/floor.entity';
import { SubRoom } from './sub-rooms/entities/sub-room.entity';

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
        InspectionTeamMember,
        Team,
        InspectionRound,
        DefectCategory,
        DefectSubCategory,
        RepairRecord,
        Contractor,
        Defect,
        RoomTemplate,
        SummaryTemplateOption,
        SummaryTemplate,
        InspectionSummaryItem,
        Floor,
        SubRoom,
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
    DefectSubCategoriesModule,
    DefectCategoriesModule,
    InspectionTeamMembersModule,
    TeamsModule,
    ContractorModule,
    RepairRecordsModule,
    InspectionRoundsModule,
    RoomTemplatesModule,
    SummaryTemplateOptionsModule,
    SummaryTemplatesModule,
    InspectionSummaryItemsModule,
    FloorModule,
    SubRoomsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
