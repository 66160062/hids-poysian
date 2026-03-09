import { Injectable } from '@nestjs/common';
import { CreateInpectorDto } from './dto/create-inpector.dto';
import { UpdateInpectorDto } from './dto/update-inpector.dto';

@Injectable()
export class InpectorsService {
  create(createInpectorDto: CreateInpectorDto) {
    return 'This action adds a new inpector';
  }

  findAll() {
    return `This action returns all inpectors`;
  }

  findOne(id: number) {
    return `This action returns a #${id} inpector`;
  }

  update(id: number, updateInpectorDto: UpdateInpectorDto) {
    return `This action updates a #${id} inpector`;
  }

  remove(id: number) {
    return `This action removes a #${id} inpector`;
  }
}
