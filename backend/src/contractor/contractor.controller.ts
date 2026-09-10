import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ContractorService } from './contractor.service';
import { CreateContractorDto } from './dto/create-contractor.dto';
import { UpdateContractorDto } from './dto/update-contractor.dto';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('contractors')
export class ContractorController {
  constructor(private readonly contractorService: ContractorService) {}

  @Post()
  @UseGuards(AuthGuard)
  create(@Body() createContractorDto: CreateContractorDto) {
    return this.contractorService.create(createContractorDto);
  }

  @Get()
  @UseGuards(AuthGuard)
  findAll() {
    return this.contractorService.findAll();
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  findOne(@Param('id') id: string) {
    return this.contractorService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateContractorDto: UpdateContractorDto,
  ) {
    return this.contractorService.update(+id, updateContractorDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  remove(@Param('id') id: string) {
    return this.contractorService.remove(+id);
  }
}
