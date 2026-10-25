import { Module } from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { AddressesController } from './addresses.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Address } from './entities/address.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Address]), AuthModule],
  controllers: [AddressesController],
  providers: [AddressesService],
  exports: [AddressesService, TypeOrmModule],
})
export class AddressesModule {}
