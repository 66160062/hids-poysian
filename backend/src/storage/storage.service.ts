import { Injectable, Logger } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

const BUCKET = 'hids-uploads';
const MAX_DIMENSION = 1920;
const MAX_PASSTHROUGH_BYTES = 1024 * 1024;
const JPEG_QUALITY = 80;
const PUBLIC_URL_PREFIX = `/storage/v1/object/public/${BUCKET}/`;

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

@Injectable()
export class StorageService {
  private readonly client = createClient(
    process.env.SUPABASE_URL ?? '',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  );

  async uploadImage(buffer: Buffer, folder: string): Promise<string> {
    const outputBuffer = await this.compress(buffer);
    return this.upload(outputBuffer, folder, 'jpg', 'image/jpeg');
  }

  async uploadPdf(buffer: Buffer, folder: string): Promise<string> {
    return this.upload(buffer, folder, 'pdf', 'application/pdf');
  }

  // ลบไฟล์เก่าออกจาก Storage ตอนมีไฟล์ใหม่มาแทนที่ (เช่น PDF cache ที่ regenerate ทับ) —
  // best-effort เท่านั้น ไม่ throw ถ้าลบไม่สำเร็จ เพราะไฟล์ใหม่ใช้งานได้อยู่แล้ว แค่ลบของเก่าไม่ทันไม่ใช่ปัญหาคอขาดบาดตาย
  async deleteFile(publicUrl: string | null | undefined): Promise<void> {
    if (!publicUrl) return;

    const idx = publicUrl.indexOf(PUBLIC_URL_PREFIX);
    if (idx === -1) return;
    const path = publicUrl.slice(idx + PUBLIC_URL_PREFIX.length);

    const { error } = await this.client.storage.from(BUCKET).remove([path]);
    if (error) {
      this.logger.warn(
        `ลบไฟล์เก่าออกจาก Supabase Storage ไม่สำเร็จ (${path}): ${error.message}`,
      );
    }
  }

  private async upload(
    buffer: Buffer,
    folder: string,
    extension: string,
    contentType: string,
  ): Promise<string> {
    const path = `${folder}/${uuidv4()}.${extension}`;

    const { error } = await this.client.storage
      .from(BUCKET)
      .upload(path, buffer, {
        contentType,
    const path = `${folder}/${uuidv4()}.jpg`;

    const { error } = await this.client.storage
      .from(BUCKET)
      .upload(path, outputBuffer, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (error) {
      throw new Error(
        `อัปโหลดไฟล์ไป Supabase Storage ไม่สำเร็จ: ${error.message}`,
      );
    }

    return this.client.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  }

  // ข้ามการ re-encode ถ้าไฟล์ที่ส่งมาเล็ก/เป็น jpeg อยู่แล้ว (เช่นบีบอัดมาจาก frontend) กันไม่ให้เสียคุณภาพซ้ำโดยไม่จำเป็น
  private async compress(buffer: Buffer): Promise<Buffer> {
    const metadata = await sharp(buffer).metadata();
    const withinSize = buffer.byteLength <= MAX_PASSTHROUGH_BYTES;
    const withinDimensions =
      (metadata.width ?? Infinity) <= MAX_DIMENSION &&
      (metadata.height ?? Infinity) <= MAX_DIMENSION;

    if (withinSize && withinDimensions && metadata.format === 'jpeg') {
      return buffer;
    }

    return sharp(buffer)
      .rotate()
      .resize({
        width: MAX_DIMENSION,
        height: MAX_DIMENSION,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: JPEG_QUALITY })
      .toBuffer();
  }
}
