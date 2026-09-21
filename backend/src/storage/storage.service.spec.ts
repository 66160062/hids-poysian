import { StorageService } from './storage.service';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';

type MockBucket = {
  upload: jest.Mock;
  remove: jest.Mock;
  list: jest.Mock;
  download: jest.Mock;
  getPublicUrl: jest.Mock;
};

// client ที่ createClient mock คืนมาเป็น any — ห่อให้มีชนิดจะได้ไม่ต้องแตะ any ทุกบรรทัด
const mockBucket = (): MockBucket => {
  const client = (createClient as jest.Mock).mock.results[0].value as {
    storage: { from: () => MockBucket };
  };
  return client.storage.from();
};

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new StorageService();
  });

  describe('uploadImage', () => {
    it('re-encodes a large or non-webp image to webp before uploading', async () => {
      (sharp as unknown as jest.Mock).mockReturnValue({
        metadata: jest.fn().mockResolvedValue({
          width: 4000,
          height: 3000,
          format: 'png',
        }),
        rotate: jest.fn().mockReturnThis(),
        resize: jest.fn().mockReturnThis(),
        webp: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue(Buffer.from('resized')),
      });

      const url = await service.uploadImage(Buffer.from('original'), 'defects');

      expect(url).toBe('https://example.com/mock.jpg');
      const client = (createClient as jest.Mock).mock.results[0].value;
      expect(client.storage.from().upload).toHaveBeenCalledWith(
        expect.stringMatching(/^defects\/test-uuid\.webp$/),
        Buffer.from('resized'),
        { contentType: 'image/webp', upsert: false },
      );
    });

    it('passes a small, already-webp image straight through without re-encoding', async () => {
      const original = Buffer.alloc(100, 1);
      (sharp as unknown as jest.Mock).mockReturnValue({
        metadata: jest.fn().mockResolvedValue({
          width: 800,
          height: 600,
          format: 'webp',
        }),
      });

      await service.uploadImage(original, 'defects');

      const client = (createClient as jest.Mock).mock.results[0].value;
      expect(client.storage.from().upload).toHaveBeenCalledWith(
        expect.any(String),
        original,
        expect.anything(),
      );
    });
  });

  // รูปย่อสำหรับฝังในรายงาน PDF — ต้นฉบับ 1920px ทำให้ไฟล์ใหญ่เกินเพดานอัปโหลดของ Storage
  describe('ensureThumbnail', () => {
    const ORIGINAL =
      'https://project.supabase.co/storage/v1/object/public/hids-uploads/defects/a.webp';

    beforeEach(() => {
      (sharp as unknown as jest.Mock).mockReturnValue({
        rotate: jest.fn().mockReturnThis(),
        resize: jest.fn().mockReturnThis(),
        webp: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue(Buffer.from('thumb')),
      });
    });

    it('resizes and uploads the thumbnail when it does not exist yet', async () => {
      const url = await service.ensureThumbnail(ORIGINAL, 600);

      expect(mockBucket().download).toHaveBeenCalledWith('defects/a.webp');
      expect(mockBucket().upload).toHaveBeenCalledWith(
        expect.stringMatching(/^thumbs\/[0-9a-f]{40}\.webp$/),
        Buffer.from('thumb'),
        { contentType: 'image/webp', upsert: true },
      );
      expect(url).toBe('https://example.com/mock.jpg');
    });

    // เรียกซ้ำต้องไม่สร้างไฟล์ใหม่ ไม่งั้นทุกครั้งที่ render รายงานจะย่อรูปใหม่ทั้งเล่ม
    it('reuses the existing thumbnail without downloading or re-encoding', async () => {
      // ตอบกลับว่ามีไฟล์ชื่อตรงกับที่ค้นหาอยู่แล้ว = รูปย่อถูกสร้างไว้ก่อนหน้านี้
      mockBucket().list.mockImplementation(
        (_folder: string, opts: { search: string }) =>
          Promise.resolve({ data: [{ name: opts.search }], error: null }),
      );

      const url = await service.ensureThumbnail(ORIGINAL, 600);

      expect(mockBucket().download).not.toHaveBeenCalled();
      expect(mockBucket().upload).not.toHaveBeenCalled();
      expect(url).toBe('https://example.com/mock.jpg');
    });

    it('returns the url untouched when it is not a file in our bucket', async () => {
      const outside = 'https://images.unsplash.com/photo-123?w=600';

      await expect(service.ensureThumbnail(outside, 600)).resolves.toBe(
        outside,
      );

      expect(mockBucket().download).not.toHaveBeenCalled();
    });

    it('never makes a thumbnail of a thumbnail', async () => {
      const thumb =
        'https://project.supabase.co/storage/v1/object/public/hids-uploads/thumbs/abc.webp';

      await expect(service.ensureThumbnail(thumb, 600)).resolves.toBe(thumb);

      expect(mockBucket().download).not.toHaveBeenCalled();
    });
  });

  describe('deleteFile', () => {
    it('does nothing when given a null or undefined url', async () => {
      await service.deleteFile(null);
      await service.deleteFile(undefined);

      const client = (createClient as jest.Mock).mock.results[0].value;
      expect(client.storage.from().remove).not.toHaveBeenCalled();
    });

    it('does nothing when the url does not match the expected storage prefix', async () => {
      await service.deleteFile('https://example.com/unrelated/file.jpg');

      const client = (createClient as jest.Mock).mock.results[0].value;
      expect(client.storage.from().remove).not.toHaveBeenCalled();
    });

    it('extracts the storage-relative path from a public url and removes it', async () => {
      await service.deleteFile(
        'https://project.supabase.co/storage/v1/object/public/hids-uploads/reports/old.pdf',
      );

      const client = (createClient as jest.Mock).mock.results[0].value;
      // ลบรูปย่อที่ผูกกับไฟล์นั้นไปพร้อมกัน ไม่งั้นจะเหลือตกค้างกินพื้นที่โดยไม่มีใครอ้างถึง
      // (ดู ensureThumbnail) path ของรูปย่อคำนวณจาก path ต้นฉบับแบบตายตัวจึงรู้ล่วงหน้าได้
      const removed = client.storage.from().remove.mock.calls[0][0] as string[];
      expect(removed[0]).toBe('reports/old.pdf');
      const thumbs = removed.slice(1);
      expect(thumbs.length).toBeGreaterThan(0);
      expect(thumbs.every((p: string) => p.startsWith('thumbs/'))).toBe(true);
    });

    it('does not throw when the remove call itself returns an error', async () => {
      const client = (createClient as jest.Mock).mock.results[0].value;
      client.storage.from().remove.mockResolvedValueOnce({
        error: { message: 'not found' },
      });

      await expect(
        service.deleteFile(
          'https://project.supabase.co/storage/v1/object/public/hids-uploads/reports/missing.pdf',
        ),
      ).resolves.toBeUndefined();
    });
  });
});
