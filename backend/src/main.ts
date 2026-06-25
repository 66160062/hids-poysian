import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
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

  const staticPath = join(process.cwd(), 'uploads');
  app.useStaticAssets(staticPath, { prefix: '/uploads' });
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads',
    index: false,
    redirect: false,
  });

  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  await app.listen(process.env.PORT || 3000);
}
void bootstrap();
