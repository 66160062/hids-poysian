import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { RepairRecordsService } from './repair-records.service';
import { CreateRepairRecordDto } from './dto/create-repair-record.dto';
import { UpdateRepairRecordDto } from './dto/update-repair-record.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Repair Records') // จัดกลุ่มใน Swagger
@Controller('repair-records')
export class RepairRecordsController {
  constructor(private readonly repairRecordsService: RepairRecordsService) {}

  @Post()
  @ApiOperation({ summary: 'บันทึกการซ่อมใหม่' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/repair_records',
        filename: (req, file, cb) => {
          const uniqueFileName = uuidv4() + extname(file.originalname);
          cb(null, uniqueFileName);
        },
      }),
    }),
  )
  create(
    @UploadedFile() file: Express.Multer.File,
    @Body() createRepairRecordDto: CreateRepairRecordDto,
  ) {
    // ส่งข้อมูลเข้า Service พร้อมจัดการ Path รูปภาพและขนาดไฟล์
    return this.repairRecordsService.create({
      ...createRepairRecordDto,
      imageUrl: file
        ? '/uploads/repair_records/' + file.filename
        : '/uploads/repair_records/default.jpg',
      fileSize: file ? file.size : 0,
    });
  }

  @Get()
  @ApiOperation({ summary: 'ดูรายการบันทึกการซ่อมทั้งหมด' })
  findAll() {
    return this.repairRecordsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'ดูรายละเอียดการซ่อมรายรายการ' })
  findOne(@Param('id') id: string) {
    return this.repairRecordsService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'อัปเดตบันทึกการซ่อม' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/repair_records',
        filename: (req, file, cb) => {
          const uniqueFileName = uuidv4() + extname(file.originalname);
          cb(null, uniqueFileName);
        },
      }),
    }),
  )
  update(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() updateRepairRecordDto: UpdateRepairRecordDto,
  ) {
    return this.repairRecordsService.update(+id, {
      ...updateRepairRecordDto,
      imageUrl: file ? '/uploads/repair_records/' + file.filename : undefined,
      fileSize: file ? file.size : undefined,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'ลบบันทึกการซ่อม (Soft Delete)' })
  remove(@Param('id') id: string) {
    return this.repairRecordsService.remove(+id);
  }
}
