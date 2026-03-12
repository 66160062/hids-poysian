import { Injectable } from '@nestjs/common';
import { CreateDefectDto } from './dto/create-defect.dto';
import { UpdateDefectDto } from './dto/update-defect.dto';

@Injectable()
export class DefectsService {
  create(createDefectDto: CreateDefectDto) {
    return 'This action adds a new defect';
  }

  findAll() {
    return `This action returns all defects`;
  }

  findOne(id: number) {
    return `This action returns a #${id} defect`;
  }

  update(id: number, updateDefectDto: UpdateDefectDto) {
    return `This action updates a #${id} defect`;
  }

  remove(id: number) {
    return `This action removes a #${id} defect`;
  }
}
