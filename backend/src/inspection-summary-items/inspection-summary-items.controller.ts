import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InspectionSummaryItemsService } from './inspection-summary-items.service';
import { CreateInspectionSummaryItemDto } from './dto/create-inspection-summary-item.dto';
import { UpdateInspectionSummaryItemDto } from './dto/update-inspection-summary-item.dto';
import { CreateInspectionSummaryItemPhotoDto } from './dto/create-inspection-summary-item-photo.dto';

@Controller('inspection-summary-items')
export class InspectionSummaryItemsController {
  constructor(
    private readonly inspectionSummaryItemsService: InspectionSummaryItemsService,
  ) {}

  @Post()
  create(
    @Body() createInspectionSummaryItemDto: CreateInspectionSummaryItemDto,
  ) {
    return this.inspectionSummaryItemsService.create(
      createInspectionSummaryItemDto,
    );
  }

  @Post('photo')
  @UseInterceptors(FileInterceptor('file'))
  uploadPhoto(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() dto: CreateInspectionSummaryItemPhotoDto,
  ) {
    return this.inspectionSummaryItemsService.createPhotoItem(file, dto);
  }

  @Get()
  findAll() {
    return this.inspectionSummaryItemsService.findAll();
  }

  @Get('round/:roundId')
  findByRound(@Param('roundId', ParseIntPipe) roundId: number) {
    return this.inspectionSummaryItemsService.findByRound(roundId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.inspectionSummaryItemsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateInspectionSummaryItemDto: UpdateInspectionSummaryItemDto,
  ) {
    return this.inspectionSummaryItemsService.update(
      +id,
      updateInspectionSummaryItemDto,
    );
  }

  @Delete('round/:roundId')
  deleteByRound(@Param('roundId', ParseIntPipe) roundId: number) {
    return this.inspectionSummaryItemsService.deleteByRound(roundId);
  }

  @Delete('round/:roundId/template/:templateId')
  deleteByRoundAndTemplate(
    @Param('roundId', ParseIntPipe) roundId: number,
    @Param('templateId', ParseIntPipe) templateId: number,
  ) {
    return this.inspectionSummaryItemsService.deleteByRoundAndTemplate(
      roundId,
      templateId,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.inspectionSummaryItemsService.remove(+id);
  }
}
