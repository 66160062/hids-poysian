import { StorageService } from './storage.service';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new StorageService();
  });

  describe('uploadImage', () => {
    it('re-encodes a large or non-jpeg image to jpeg before uploading', async () => {
      (sharp as unknown as jest.Mock).mockReturnValue({
        metadata: jest.fn().mockResolvedValue({
          width: 4000,
          height: 3000,
          format: 'png',
        }),
        rotate: jest.fn().mockReturnThis(),
        resize: jest.fn().mockReturnThis(),
        jpeg: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue(Buffer.from('resized')),
      });

      const url = await service.uploadImage(Buffer.from('original'), 'defects');

      expect(url).toBe('https://example.com/mock.jpg');
      const client = (createClient as jest.Mock).mock.results[0].value;
      expect(client.storage.from().upload).toHaveBeenCalledWith(
        expect.stringMatching(/^defects\/test-uuid\.jpg$/),
        Buffer.from('resized'),
        { contentType: 'image/jpeg', upsert: false },
      );
    });

    it('passes a small, already-jpeg image straight through without re-encoding', async () => {
      const original = Buffer.alloc(100, 1);
      (sharp as unknown as jest.Mock).mockReturnValue({
        metadata: jest.fn().mockResolvedValue({
          width: 800,
          height: 600,
          format: 'jpeg',
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
      expect(client.storage.from().remove).toHaveBeenCalledWith([
        'reports/old.pdf',
      ]);
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
