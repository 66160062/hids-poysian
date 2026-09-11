import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Put,
  Param,
  Delete,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InspectionSummaryItemsService } from './inspection-summary-items.service';
import { CreateInspectionSummaryItemDto } from './dto/create-inspection-summary-item.dto';
import { UpdateInspectionSummaryItemDto } from './dto/update-inspection-summary-item.dto';
import { CreateInspectionSummaryItemPhotoDto } from './dto/create-inspection-summary-item-photo.dto';
import { ReplaceRoundSummaryItemsDto } from './dto/replace-round-summary-items.dto';
import { RoundAccessGuard } from 'src/auth/round-access.guard';
import { AuthGuard } from 'src/auth/auth.guard';
import { SummaryItemAccessGuard } from './guards/summary-item-access.guard';

@Controller('inspection-summary-items')
export class InspectionSummaryItemsController {
  constructor(
    private readonly inspectionSummaryItemsService: InspectionSummaryItemsService,
  ) {}

  @Post()
  @UseGuards(AuthGuard)
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
  @UseGuards(AuthGuard)
  findAll() {
    return this.inspectionSummaryItemsService.findAll();
  }

  @Get('round/:roundId')
  @UseGuards(RoundAccessGuard)
  findByRound(@Param('roundId', ParseIntPipe) roundId: number) {
    return this.inspectionSummaryItemsService.findByRound(roundId);
  }

  @Put('round/:roundId')
  @UseGuards(RoundAccessGuard)
  replaceForRound(
    @Param('roundId', ParseIntPipe) roundId: number,
    @Body() dto: ReplaceRoundSummaryItemsDto,
  ) {
    return this.inspectionSummaryItemsService.replaceForRound(
      roundId,
      dto.items,
    );
  }

  @Get(':id')
  @UseGuards(SummaryItemAccessGuard)
  findOne(@Param('id') id: string) {
    return this.inspectionSummaryItemsService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(SummaryItemAccessGuard)
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
  @UseGuards(RoundAccessGuard)
  deleteByRound(@Param('roundId', ParseIntPipe) roundId: number) {
    return this.inspectionSummaryItemsService.deleteByRound(roundId);
  }

  @Delete('round/:roundId/template/:templateId')
  @UseGuards(RoundAccessGuard)
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
  @UseGuards(SummaryItemAccessGuard)
  remove(@Param('id') id: string) {
    return this.inspectionSummaryItemsService.remove(+id);
  }
}
