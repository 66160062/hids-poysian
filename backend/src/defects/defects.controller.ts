import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Put,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
} from '@nestjs/common';
import { DefectsService } from './defects.service';
import { CreateDefectDto } from './dto/create-defect.dto';
import { UpdateDefectDto } from './dto/update-defect.dto';
import { ContractorUpdateDefectDto } from './dto/contractor-update-defect.dto';
import { ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';

@Controller('defects')
export class DefectsController {
  constructor(private readonly defectsService: DefectsService) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/defects',
        filename: (req, file, cb) => {
          let ext = extname(file.originalname);
          if (!ext && file.mimetype) {
            ext = `.${file.mimetype.split('/')[1]}`;
          }
          const uniqueFileName = uuidv4() + ext;
          cb(null, uniqueFileName);
        },
      }),
    }),
  )
  create(
    @UploadedFile() file: Express.Multer.File,
    @Body() createDefectDto: CreateDefectDto,
  ) {
    return this.defectsService.create({
      ...createDefectDto,
      imageUrl: file ? '/uploads/defects/' + file.filename : undefined,
      imageFileSize: file ? file.size : undefined,
    });
  }

  @Get()
  findAll() {
    return this.defectsService.findAll();
  }

  @Get('round/:roundId')
  findByRound(@Param('roundId', ParseIntPipe) roundId: number) {
    return this.defectsService.findByRound(roundId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.defectsService.findOne(+id);
  }

  @Put('contractor-update')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/defects',
        filename: (req, file, cb) => {
          let ext = extname(file.originalname);
          if (!ext && file.mimetype) {
            ext = `.${file.mimetype.split('/')[1]}`;
          }
          const uniqueFileName = uuidv4() + ext;
          cb(null, uniqueFileName);
        },
      }),
    }),
  )
  contractorUpdate(
    @UploadedFile() file: Express.Multer.File,
    @Body() contractorUpdateDto: ContractorUpdateDefectDto,
  ) {
    return this.defectsService.contractorUpdate({
      ...contractorUpdateDto,
      ...(file && {
        contractorImageUrl: '/uploads/defects/' + file.filename,
        contractorImageFileSize: file.size,
      }),
    });
  }

  @Patch(':id')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/defects',
        filename: (req, file, cb) => {
          let ext = extname(file.originalname);
          if (!ext && file.mimetype) {
            ext = `.${file.mimetype.split('/')[1]}`;
          }
          const uniqueFileName = uuidv4() + ext;
          cb(null, uniqueFileName);
        },
      }),
    }),
  )
  update(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @Body() updateDefectDto: UpdateDefectDto,
  ) {
    return this.defectsService.update(id, {
      ...updateDefectDto,
      ...(file && {
        imageUrl: '/uploads/defects/' + file.filename,
        imageFileSize: file.size,
      }),
    });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.defectsService.remove(+id);
  }
}
