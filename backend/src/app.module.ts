import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { Inpector } from './inpectors/entities/inpector.entity';

@Module({
  imports: [AuthModule, UsersModule, Inpector],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
