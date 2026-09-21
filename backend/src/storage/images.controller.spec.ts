import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import type { Response } from 'express';
import { ImagesController } from './images.controller';
import { StorageService } from './storage.service';

const OWN_URL =
  'https://project.supabase.co/storage/v1/object/public/hids-uploads/defects/a.webp';

describe('ImagesController', () => {
  let controller: ImagesController;
  let storageService: jest.Mocked<Pick<StorageService, 'ensureThumbnail'>>;
  let res: { redirect: jest.Mock };

  beforeEach(async () => {
    const storageMock = { ensureThumbnail: jest.fn() };
    res = { redirect: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ImagesController],
      providers: [{ provide: StorageService, useValue: storageMock }],
    }).compile();

    controller = module.get<ImagesController>(ImagesController);
    storageService = module.get(StorageService);
  });

  it('redirects to the generated thumbnail', async () => {
    storageService.ensureThumbnail.mockResolvedValue(
      'https://project.supabase.co/storage/v1/object/public/hids-uploads/thumbs/x.webp',
    );

    await controller.thumb(res as unknown as Response, OWN_URL, '600');

    expect(storageService.ensureThumbnail).toHaveBeenCalledWith(OWN_URL, 600);
    expect(res.redirect).toHaveBeenCalledWith(
      302,
      'https://project.supabase.co/storage/v1/object/public/hids-uploads/thumbs/x.webp',
    );
  });

  // endpoint นี้ไม่มี guard (เรียกจาก <img src> ที่แนบ token ไม่ได้) จึงต้องกันไม่ให้พามันไป
  // ดึง/redirect ไป URL นอกระบบ
  it('rejects a src that is not a file in our bucket', async () => {
    await expect(
      controller.thumb(
        res as unknown as Response,
        'https://evil.example.com/a.png',
        '600',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(storageService.ensureThumbnail).not.toHaveBeenCalled();
    expect(res.redirect).not.toHaveBeenCalled();
  });

  it('rejects a width outside the allowed list', async () => {
    await expect(
      controller.thumb(res as unknown as Response, OWN_URL, '137'),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(storageService.ensureThumbnail).not.toHaveBeenCalled();
  });

  it('rejects a missing src', async () => {
    await expect(
      controller.thumb(res as unknown as Response, undefined, '600'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  // ย่อไม่สำเร็จแล้วปล่อยให้ 500 จะทำให้รูปในรายงานหายไปทั้งใบ ส่งต้นฉบับแทนดีกว่า (แค่ไฟล์ใหญ่ขึ้น)
  it('falls back to the original image when resizing fails', async () => {
    storageService.ensureThumbnail.mockRejectedValue(new Error('sharp boom'));

    await controller.thumb(res as unknown as Response, OWN_URL, '600');

    expect(res.redirect).toHaveBeenCalledWith(302, OWN_URL);
  });
});
