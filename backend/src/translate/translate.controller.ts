import {
  Body,
  Controller,
  Post,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { AdminGuard } from 'src/auth/admin.guard';
import { TranslationService } from 'src/ai-summary/translation.service';
import { TranslateTextDto } from './dto/translate-text.dto';

// ปุ่มแปลสองทาง (ไทย ⇄ อังกฤษ) ในหน้าจัดการ master data — แปลทีละคำสั้นๆ ให้แอดมินตรวจ/แก้ก่อนบันทึกเอง
@ApiBearerAuth()
@UseGuards(AuthGuard, AdminGuard)
@Controller('translate')
export class TranslateController {
  constructor(private readonly translation: TranslationService) {}

  @Post()
  async translate(@Body() dto: TranslateTextDto) {
    const text =
      dto.target === 'en'
        ? await this.translation.toEnglish(dto.text)
        : await this.translation.toThai(dto.text);
    if (!text) {
      throw new ServiceUnavailableException(
        'แปลอัตโนมัติไม่สำเร็จ กรุณากรอกเอง',
      );
    }
    return { text };
  }
}
