import { Global, Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { ImagesController } from './images.controller';

@Global()
@Module({
  controllers: [ImagesController],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
