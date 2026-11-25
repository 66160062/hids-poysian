import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = new DocumentBuilder()
    .setTitle('HIDS example')
    .setDescription('The HIDS API description')
    .setVersion('1.0')
    .addTag('hids')
    .addBearerAuth()
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  app.enableCors();

  // whitelist: ตัด field ที่ไม่ได้ประกาศใน DTO ทิ้ง กัน mass assignment (เช่นส่ง role/branchId แอบเข้ามา)
  // ยังไม่เปิด forbidNonWhitelisted เพราะ frontend บางหน้าส่ง field เกินมา (เช่น roundId ใน POST /assignments)
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  await app.listen(process.env.PORT || 3000);
}
void bootstrap();
