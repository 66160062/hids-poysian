import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { InspectionSummaryItemsController } from './inspection-summary-items.controller';
import { InspectionSummaryItemsService } from './inspection-summary-items.service';
import { AuthService } from 'src/auth/auth.service';
import { ReportsService } from 'src/reports/reports.service';
import { InspectionRound } from 'src/inspection-rounds/entities/inspection-round.entity';
import { InspectionSummaryItem } from './entities/inspection-summary-item.entity';

describe('InspectionSummaryItemsController', () => {
  let controller: InspectionSummaryItemsController;
  let service: jest.Mocked<
    Pick<
      InspectionSummaryItemsService,
      | 'findOne'
      | 'findByRound'
      | 'deleteByRound'
      | 'deleteByRoundAndTemplate'
      | 'replaceForRound'
      | 'remove'
    >
  >;
  let reports: jest.Mocked<Pick<ReportsService, 'scheduleRegeneration'>>;

  beforeEach(async () => {
    const serviceMock = {
      findOne: jest.fn(),
      findByRound: jest.fn(),
      deleteByRound: jest.fn(),
      deleteByRoundAndTemplate: jest.fn(),
      replaceForRound: jest.fn(),
      remove: jest.fn(),
    };
    const reportsMock = { scheduleRegeneration: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [InspectionSummaryItemsController],
      providers: [
        { provide: InspectionSummaryItemsService, useValue: serviceMock },
        { provide: ReportsService, useValue: reportsMock },
        {
          provide: AuthService,
          useValue: {
            verifyJobAccess: jest.fn(),
            verifyRoundAccess: jest.fn(),
          },
        },
        { provide: getRepositoryToken(InspectionRound), useValue: {} },
        { provide: getRepositoryToken(InspectionSummaryItem), useValue: {} },
        { provide: JwtService, useValue: { verify: jest.fn() } },
      ],
    }).compile();

    controller = module.get<InspectionSummaryItemsController>(
      InspectionSummaryItemsController,
    );
    service = module.get(InspectionSummaryItemsService);
    reports = module.get(ReportsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('converts the route param to a number when looking up one item', () => {
    controller.findOne('4');

    expect(service.findOne).toHaveBeenCalledWith(4);
  });

  it('forwards the parsed roundId when listing items for a round', () => {
    controller.findByRound(7);

    expect(service.findByRound).toHaveBeenCalledWith(7);
  });

  it('forwards both parsed ids when deleting by round and template', async () => {
    await controller.deleteByRoundAndTemplate(7, 2);

    expect(service.deleteByRoundAndTemplate).toHaveBeenCalledWith(7, 2);
  });

  it('unwraps the items array when replacing a round summary', async () => {
    const items = [{ templateId: 1, optionId: 10 }];

    await controller.replaceForRound(7, { items });

    expect(service.replaceForRound).toHaveBeenCalledWith(7, items);
  });

  // แบบสรุปขึ้นเป็นหน้าสรุปในเล่มรายงาน ถ้าไม่สั่ง regenerate ตรงนี้ เล่มที่แนบไปกับอีเมลอนุมัติ
  // จะเป็นของเก่าที่ไม่มีหน้าสรุป โดยที่ UI ยังขึ้นว่าล่าสุดแล้ว (ดู ReportsService.computeDataHash)
  it('schedules a report regeneration after replacing a round summary', async () => {
    await controller.replaceForRound(7, { items: [] });

    expect(reports.scheduleRegeneration).toHaveBeenCalledWith(7);
  });

  it('schedules a report regeneration after deleting every item of a round', async () => {
    await controller.deleteByRound(7);

    expect(reports.scheduleRegeneration).toHaveBeenCalledWith(7);
  });

  // ลบรูปหลักฐานรายใบ — service ไม่ได้โหลด relation round มาให้ เลยต้องพึ่ง RelationId บน entity
  it('schedules a report regeneration from the removed item round id', async () => {
    service.remove.mockResolvedValue({ itemId: 3, roundId: 9 } as never);

    await controller.remove('3');

    expect(reports.scheduleRegeneration).toHaveBeenCalledWith(9);
  });

  it('does not schedule anything when the removed item has no round', async () => {
    service.remove.mockResolvedValue({ itemId: 3 } as never);

    await controller.remove('3');

    expect(reports.scheduleRegeneration).not.toHaveBeenCalled();
  });
});
