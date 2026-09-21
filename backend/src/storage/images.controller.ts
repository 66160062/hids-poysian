import {
  BadRequestException,
  Controller,
  Get,
  Logger,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { StorageService } from './storage.service';

// endpoint นี้ไม่มี guard เพราะถูกเรียกจาก <img src> ตรงๆ ซึ่งแนบ Authorization header ไม่ได้
// ไฟล์ปลายทางอยู่ในบัคเก็ต public อยู่แล้ว จึงไม่ได้เปิดอะไรที่เดิมปิดอยู่ — แต่ต้องกัน SSRF
// และ open redirect ด้วยการรับเฉพาะ URL ที่ชี้เข้าบัคเก็ตของเรา และความกว้างที่กำหนดไว้เท่านั้น
@Controller('images')
export class ImagesController {
  private readonly logger = new Logger(ImagesController.name);

  constructor(private readonly storageService: StorageService) {}

  @Get('thumb')
  async thumb(
    @Res() res: Response,
    @Query('src') src?: string,
    @Query('w') widthRaw?: string,
  ): Promise<void> {
    const width = Number(widthRaw);

    if (!src || !StorageService.isOwnPublicUrl(src)) {
      throw new BadRequestException('src ต้องเป็นไฟล์ใน Storage ของระบบ');
    }
    if (!StorageService.isAllowedThumbWidth(width)) {
      throw new BadRequestException('w ไม่อยู่ในความกว้างที่รองรับ');
    }

    try {
      const url = await this.storageService.ensureThumbnail(src, width);
      // redirect ไปไฟล์บน Storage ตรงๆ ให้เบราว์เซอร์/CDN cache เอง backend จึงไม่ต้องส่ง bytes ซ้ำทุกครั้ง
      res.redirect(302, url);
    } catch (error) {
      // ย่อไม่สำเร็จก็ส่งต้นฉบับไปแทน ดีกว่าปล่อยให้รูปในรายงานหายไปทั้งใบ
      // (src ผ่านการตรวจแล้วว่าเป็นไฟล์ในบัคเก็ตเรา จึง redirect กลับไปได้อย่างปลอดภัย)
      this.logger.warn(
        `ย่อรูปไม่สำเร็จ ใช้ต้นฉบับแทน (${src}): ${error instanceof Error ? error.message : String(error)}`,
      );
      res.redirect(302, src);
    }
  }
}
