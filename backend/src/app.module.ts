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
import { RoomsModule } from './rooms/rooms.module';
import { CategoriesModule } from './categories/categories.module';
import { Category } from './categories/entities/category.entity';
import { Room } from './rooms/entities/room.entity';

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
        Category,
        Room
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
    RoomsModule,
    CategoriesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
