import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Branch } from './entities/branch.entity';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { StorageService } from 'src/storage/storage.service';

const LOGO_FOLDER = 'branches';

@Injectable()
export class BranchesService {
  constructor(
    @InjectRepository(Branch) private readonly branches: Repository<Branch>,
    private readonly storageService: StorageService,
  ) {}

  findAll() {
    return this.branches.find({
      where: { status: 'active' },
      order: { branchName: 'ASC' },
    });
  }

  async findOne(id: number) {
    const branch = await this.branches.findOneBy({ branchId: id });
    if (!branch) throw new NotFoundException(`ไม่พบบริษัท/สาขา ID ${id}`);
    return branch;
  }

  // ระบุ field ทีละตัว ไม่ spread dto — ValidationPipe ไม่ได้ตัด field แปลกปลอม (ไม่มี whitelist)
  // ถ้า spread จะรับ branchId/logoUrl/deletedAt จาก body ไปเขียนทับได้
  async create(dto: CreateBranchDto, logo?: Express.Multer.File) {
    const branch = this.branches.create({
      branchName: dto.branchName,
      phoneNumber: dto.phoneNumber,
      mailAddress: dto.mailAddress,
      facebook: dto.facebook,
      line: dto.line,
      status: dto.status,
    });
    if (logo) {
      branch.logoUrl = await this.storageService.uploadImage(
        logo.buffer,
        LOGO_FOLDER,
      );
    }
    return this.branches.save(branch);
  }

  async update(id: number, dto: UpdateBranchDto, logo?: Express.Multer.File) {
    // หาก่อนอัปโหลด: ถ้าไม่มีสาขานี้จะได้ไม่มีไฟล์ค้างใน Storage
    const branch = await this.findOne(id);

    if (dto.branchName !== undefined) branch.branchName = dto.branchName;
    if (dto.phoneNumber !== undefined) branch.phoneNumber = dto.phoneNumber;
    if (dto.mailAddress !== undefined) branch.mailAddress = dto.mailAddress;
    if (dto.facebook !== undefined) branch.facebook = dto.facebook;
    if (dto.line !== undefined) branch.line = dto.line;
    if (dto.status !== undefined) branch.status = dto.status;

    const oldLogoUrl = branch.logoUrl;
    if (logo) {
      branch.logoUrl = await this.storageService.uploadImage(
        logo.buffer,
        LOGO_FOLDER,
      );
    }

    const saved = await this.branches.save(branch);
    // ลบโลโก้เก่าหลัง save สำเร็จเท่านั้น ถ้า save พังจะยังมีรูปเดิมให้ใช้
    if (logo && oldLogoUrl) await this.storageService.deleteFile(oldLogoUrl);
    return saved;
  }

  async remove(id: number) {
    const branch = await this.findOne(id);
    branch.status = 'inactive';
    return this.branches.save(branch);
  }
}
