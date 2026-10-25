import { Repository } from 'typeorm';
import { NotificationsService } from './notifications.service';
import { Notification, NotificationType } from './entities/notification.entity';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let repo: { create: jest.Mock; save: jest.Mock };

  beforeEach(() => {
    repo = {
      create: jest.fn((value: unknown) => value),
      save: jest.fn((value: unknown) => Promise.resolve(value)),
    };
    service = new NotificationsService(
      repo as unknown as Repository<Notification>,
    );
  });

  describe('create', () => {
    it('stores the English message next to the Thai one', async () => {
      const result = await service.create({
        type: NotificationType.INFO,
        message: 'คุณได้รับมอบหมายงานตรวจ: โครงการ A',
        messageEn: 'You have been assigned an inspection job: Project A',
        recipientUserId: 4,
        jobId: 9,
      });

      expect(result).toMatchObject({
        message: 'คุณได้รับมอบหมายงานตรวจ: โครงการ A',
        messageEn: 'You have been assigned an inspection job: Project A',
        recipientUser: { id: 4 },
        job: { jobId: 9 },
      });
    });

    it('stores null for the English message when the caller gives none', async () => {
      const result = await service.create({
        type: NotificationType.ALERT,
        message: 'ข้อความไทย',
        recipientRole: 'admin',
      });

      expect(result).toMatchObject({ messageEn: null, recipientRole: 'admin' });
    });

    it('returns null instead of throwing when saving fails', async () => {
      repo.save.mockRejectedValue(new Error('db down'));

      await expect(
        service.create({ type: NotificationType.INFO, message: 'x' }),
      ).resolves.toBeNull();
    });
  });
});
