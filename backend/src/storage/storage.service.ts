import { Injectable, Logger } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

const BUCKET = 'hids-uploads';
const MAX_DIMENSION = 1920;
const MAX_PASSTHROUGH_BYTES = 1024 * 1024;
const WEBP_QUALITY = 80;
const PUBLIC_URL_PREFIX = `/storage/v1/object/public/${BUCKET}/`;

// รูปย่อสำหรับฝังในรายงาน PDF — ต้นฉบับเก็บที่ 1920px ซึ่งใหญ่กว่าที่เล่มใช้จริง (สูง 55mm ในกริด)
// หลายเท่า พอคูณรูปหลายร้อยใบ ไฟล์ PDF จะทะลุเพดานอัปโหลดของ Storage (ดู ReportsService)
const THUMB_FOLDER = 'thumbs';
const THUMB_QUALITY = 72;
// จำกัดความกว้างที่ยอมให้ขอ กันคนยิง endpoint สร้างไฟล์มั่วๆ เต็ม bucket — มีเฉพาะที่รายงานใช้จริง
// (รูป defect 600, รูปหลักฐานในหน้าสรุป 400) ส่วนโลโก้สาขา รูปหน้าปก และแปลนบ้านใช้ต้นฉบับ
// เพราะมีไม่กี่ใบต่อเล่ม ไม่ได้ทำให้ไฟล์บวม แต่เป็นรูปที่คนซูมดูจริง
const ALLOWED_THUMB_WIDTHS = [400, 600];

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client = createClient(
    process.env.SUPABASE_URL ?? '',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  );

  async uploadImage(buffer: Buffer, folder: string): Promise<string> {
    const outputBuffer = await this.compress(buffer);
    return this.upload(outputBuffer, folder, 'webp', 'image/webp');
  }

  async uploadPdf(buffer: Buffer, folder: string): Promise<string> {
    return this.upload(buffer, folder, 'pdf', 'application/pdf');
  }

  static isAllowedThumbWidth(width: number): boolean {
    return ALLOWED_THUMB_WIDTHS.includes(width);
  }

  // ใช้กันทั้ง SSRF (ไป fetch URL มั่วๆ) และ open redirect ตรง endpoint รูปย่อ
  static isOwnPublicUrl(url: string): boolean {
    return url.includes(PUBLIC_URL_PREFIX);
  }

  // คืน URL ของรูปย่อตามความกว้างที่ขอ สร้างให้ครั้งแรกครั้งเดียวแล้วใช้ซ้ำตลอด เพราะ path คำนวณ
  // จาก (path ต้นฉบับ + ความกว้าง) แบบตายตัว เรียกซ้ำจึงไม่สร้างไฟล์ซ้ำ
  // ถ้า URL ที่ส่งมาไม่ใช่ไฟล์ในบัคเก็ตเรา (เช่น placeholder ข้างนอก) จะคืนค่าเดิมกลับไปเฉยๆ
  async ensureThumbnail(publicUrl: string, width: number): Promise<string> {
    const originalPath = this.toStoragePath(publicUrl);
    if (!originalPath || originalPath.startsWith(`${THUMB_FOLDER}/`)) {
      return publicUrl;
    }

    const thumbPath = this.thumbPathFor(originalPath, width);
    if (await this.exists(thumbPath)) return this.publicUrlFor(thumbPath);

    const { data, error } = await this.client.storage
      .from(BUCKET)
      .download(originalPath);
    if (error || !data) {
      throw new Error(
        `โหลดรูปต้นฉบับจาก Supabase Storage ไม่สำเร็จ (${originalPath}): ${error?.message ?? 'ไม่มีข้อมูล'}`,
      );
    }

    const resized = await sharp(Buffer.from(await data.arrayBuffer()))
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: THUMB_QUALITY })
      .toBuffer();

    // upsert เพราะอาจมีอีก request สร้างไฟล์เดียวกันแซงไปก่อน ซึ่งไม่ใช่ปัญหา ผลลัพธ์เหมือนกัน
    const { error: uploadError } = await this.client.storage
      .from(BUCKET)
      .upload(thumbPath, resized, {
        contentType: 'image/webp',
        upsert: true,
      });
    if (uploadError) {
      throw new Error(
        `อัปโหลดรูปย่อไป Supabase Storage ไม่สำเร็จ: ${uploadError.message}`,
      );
    }

    return this.publicUrlFor(thumbPath);
  }

  // ลบไฟล์เก่าออกจาก Storage ตอนมีไฟล์ใหม่มาแทนที่ (เช่น PDF cache ที่ regenerate ทับ) —
  // best-effort เท่านั้น ไม่ throw ถ้าลบไม่สำเร็จ เพราะไฟล์ใหม่ใช้งานได้อยู่แล้ว แค่ลบของเก่าไม่ทันไม่ใช่ปัญหาคอขาดบาดตาย
  // ลบรูปย่อที่ผูกกับไฟล์นั้นตามไปด้วย ไม่งั้นจะเหลือตกค้างกินพื้นที่โดยไม่มีใครอ้างถึง
  async deleteFile(publicUrl: string | null | undefined): Promise<void> {
    if (!publicUrl) return;

    const path = this.toStoragePath(publicUrl);
    if (!path) return;

    const paths = [
      path,
      ...ALLOWED_THUMB_WIDTHS.map((w) => this.thumbPathFor(path, w)),
    ];

    const { error } = await this.client.storage.from(BUCKET).remove(paths);
    if (error) {
      this.logger.warn(
        `ลบไฟล์เก่าออกจาก Supabase Storage ไม่สำเร็จ (${path}): ${error.message}`,
      );
    }
  }

  private toStoragePath(publicUrl: string): string | null {
    const idx = publicUrl.indexOf(PUBLIC_URL_PREFIX);
    if (idx === -1) return null;
    return publicUrl.slice(idx + PUBLIC_URL_PREFIX.length);
  }

  private publicUrlFor(path: string): string {
    return this.client.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  }

  // hash จาก path ต้นฉบับ ไม่ใช่ชื่อไฟล์ดิบ เพื่อให้ได้ path สั้นและไม่ชนกันข้ามโฟลเดอร์
  private thumbPathFor(originalPath: string, width: number): string {
    const key = createHash('sha1')
      .update(`${originalPath}|${width}`)
      .digest('hex');
    return `${THUMB_FOLDER}/${key}.webp`;
  }

  private async exists(path: string): Promise<boolean> {
    const slash = path.lastIndexOf('/');
    const folder = slash === -1 ? '' : path.slice(0, slash);
    const name = slash === -1 ? path : path.slice(slash + 1);

    const { data } = await this.client.storage
      .from(BUCKET)
      .list(folder, { search: name, limit: 1 });

    return (data ?? []).some((item) => item.name === name);
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
        upsert: false,
      });

    if (error) {
      throw new Error(
        `อัปโหลดไฟล์ไป Supabase Storage ไม่สำเร็จ: ${error.message}`,
      );
    }

    return this.client.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  }

  // ข้ามการ re-encode ถ้าไฟล์ที่ส่งมาเล็ก/เป็น webp อยู่แล้ว กันไม่ให้เสียคุณภาพซ้ำโดยไม่จำเป็น
  private async compress(buffer: Buffer): Promise<Buffer> {
    const metadata = await sharp(buffer).metadata();
    const withinSize = buffer.byteLength <= MAX_PASSTHROUGH_BYTES;
    const withinDimensions =
      (metadata.width ?? Infinity) <= MAX_DIMENSION &&
      (metadata.height ?? Infinity) <= MAX_DIMENSION;

    if (withinSize && withinDimensions && metadata.format === 'webp') {
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
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
  }
}
