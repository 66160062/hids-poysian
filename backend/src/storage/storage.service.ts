import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

const BUCKET = 'hids-uploads';
const MAX_DIMENSION = 1920;
const MAX_PASSTHROUGH_BYTES = 1024 * 1024;
const JPEG_QUALITY = 80;

@Injectable()
export class StorageService {
  private readonly client = createClient(
    process.env.SUPABASE_URL ?? '',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  );

  async uploadImage(buffer: Buffer, folder: string): Promise<string> {
    const outputBuffer = await this.compress(buffer);
    const path = `${folder}/${uuidv4()}.jpg`;

    const { error } = await this.client.storage
      .from(BUCKET)
      .upload(path, outputBuffer, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (error) {
      throw new Error(
        `อัปโหลดรูปภาพไป Supabase Storage ไม่สำเร็จ: ${error.message}`,
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
