import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateBranchDto {
  @ApiProperty({ example: 'บริษัท พอยเซียน จำกัด' })
  @IsString()
  @MaxLength(255)
  branchName!: string;

  @ApiProperty({ required: false, example: 'active' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  status?: string;
}
