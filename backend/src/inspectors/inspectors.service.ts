import { Injectable } from '@nestjs/common';
import { CreateInspectorDto } from './dto/create-inspector.dto';
import { UpdateInspectorDto } from './dto/update-inspector.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inspector } from './entities/inspector.entity';

@Injectable()
export class InspectorsService {
  constructor(
    @InjectRepository(Inspector)
    private readonly inspectorRepo: Repository<Inspector>,
  ) {}

  create(createInspectorDto: CreateInspectorDto) {
    return this.inspectorRepo.save(createInspectorDto);
  }

  findAll() {
    return this.inspectorRepo.find();
  }

  findOne(id: number) {
    return this.inspectorRepo.findOneByOrFail({ id });
  }

  update(id: number, updateInspectorDto: UpdateInspectorDto) {
    return this.inspectorRepo.update(id, updateInspectorDto);
  }

  remove(id: number) {
    return this.inspectorRepo.softDelete(id);
  }
}
