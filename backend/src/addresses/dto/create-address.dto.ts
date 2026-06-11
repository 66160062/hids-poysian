import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateAddressDto {
  @ApiProperty({ description: 'บ้านเลขที่', example: '123' })
  @IsString()
  houseNumber!: string;

  @ApiProperty({ description: 'ชั้น', example: '2' })
  @IsString()
  floor!: string;

  @ApiProperty({ description: 'ซอย', example: 'สุขุมวิท 11' })
  @IsString()
  soi!: string;

  @ApiProperty({ description: 'ตำบล/แขวง', example: 'คลองเตยเหนือ' })
  @IsString()
  subDistrict!: string;

  @ApiProperty({ description: 'อำเภอ/เขต', example: 'วัฒนา' })
  @IsString()
  district!: string;

  @ApiProperty({ description: 'จังหวัด', example: 'กรุงเทพมหานคร' })
  @IsString()
  province!: string;

  @ApiProperty({ description: 'รหัสไปรษณีย์', example: '10110' })
  @IsString()
  postalCode!: string;
}
