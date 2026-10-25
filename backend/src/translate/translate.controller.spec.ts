import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ServiceUnavailableException } from '@nestjs/common';
import { TranslateController } from './translate.controller';
import { TranslationService } from 'src/ai-summary/translation.service';

describe('TranslateController', () => {
  let controller: TranslateController;
  let translation: { toEnglish: jest.Mock; toThai: jest.Mock };

  beforeEach(async () => {
    translation = { toEnglish: jest.fn(), toThai: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TranslateController],
      providers: [
        { provide: TranslationService, useValue: translation },
        { provide: JwtService, useValue: { verify: jest.fn() } },
      ],
    }).compile();

    controller = module.get(TranslateController);
  });

  it('translates to English when the target is en', async () => {
    translation.toEnglish.mockResolvedValue('Master Bedroom');

    await expect(
      controller.translate({ text: 'ห้องนอนใหญ่', target: 'en' }),
    ).resolves.toEqual({ text: 'Master Bedroom' });
    expect(translation.toEnglish).toHaveBeenCalledWith('ห้องนอนใหญ่');
    expect(translation.toThai).not.toHaveBeenCalled();
  });

  it('translates to Thai when the target is th', async () => {
    translation.toThai.mockResolvedValue('ห้องนอนใหญ่');

    await expect(
      controller.translate({ text: 'Master Bedroom', target: 'th' }),
    ).resolves.toEqual({ text: 'ห้องนอนใหญ่' });
    expect(translation.toThai).toHaveBeenCalledWith('Master Bedroom');
    expect(translation.toEnglish).not.toHaveBeenCalled();
  });

  it('throws 503 when no provider could translate', async () => {
    translation.toEnglish.mockResolvedValue(null);

    await expect(
      controller.translate({ text: 'ห้องนอนใหญ่', target: 'en' }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
