import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { User } from 'src/users/entities/user.entity';
import { InspectionJob } from 'src/inspection-jobs/entities/inspection-job.entity';
import { InspectionRound } from 'src/inspection-rounds/entities/inspection-round.entity';

export interface CreateNotificationInput {
  type: NotificationType;
  message: string;
  recipientRole?: string;
  recipientUserId?: number;
  jobId?: number;
  roundId?: number;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepo: Repository<Notification>,
  ) {}

  // การสร้างแจ้งเตือนต้องไม่ทำให้ flow หลัก (ยื่นอนุมัติ ฯลฯ) ล้มเหลว
  async create(input: CreateNotificationInput): Promise<Notification | null> {
    try {
      const notification = this.notificationsRepo.create({
        type: input.type,
        message: input.message,
        recipientRole: input.recipientRole ?? null,
        recipientUser: input.recipientUserId
          ? ({ id: input.recipientUserId } as User)
          : null,
        job: input.jobId ? ({ jobId: input.jobId } as InspectionJob) : null,
        round: input.roundId
          ? ({ roundId: input.roundId } as InspectionRound)
          : null,
      });
      return await this.notificationsRepo.save(notification);
    } catch (error) {
      this.logger.error('สร้างการแจ้งเตือนไม่สำเร็จ', error as Error);
      return null;
    }
  }

  findForRole(role: string) {
    return this.notificationsRepo.find({
      where: { recipientRole: role },
      relations: ['job', 'round'],
      order: { createdAt: 'DESC' },
    });
  }

  findForUser(userId: number) {
    return this.notificationsRepo.find({
      where: { recipientUser: { id: userId } },
      relations: ['job', 'round'],
      order: { createdAt: 'DESC' },
    });
  }

  async setRead(id: number, isRead: boolean) {
    const notification = await this.notificationsRepo.findOneByOrFail({
      notificationId: id,
    });
    notification.isRead = isRead;
    return this.notificationsRepo.save(notification);
  }

  async markAllReadForRole(role: string) {
    await this.notificationsRepo.update(
      { recipientRole: role, isRead: false },
      { isRead: true },
    );
  }

  async remove(id: number) {
    const notification = await this.notificationsRepo.findOneByOrFail({
      notificationId: id,
    });
    return this.notificationsRepo.remove(notification);
  }
}
