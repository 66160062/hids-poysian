import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber } from 'class-validator';

export class CreateAddressDto {
  @ApiProperty({ description: 'บ้านเลขที่', example: '123' })
  @IsString()
  house_number: string;

  @ApiProperty({ description: 'ชั้น', example: '2' })
  @IsString()
  floor: string;

  @ApiProperty({ description: 'ซอย', example: 'สุขุมวิท 11' })
  @IsString()
  soi: string;

  @ApiProperty({ description: 'ตำบล/แขวง', example: 'คลองเตยเหนือ' })
  @IsString()
  sub_district: string;

  @ApiProperty({ description: 'อำเภอ/เขต', example: 'วัฒนา' })
  @IsString()
  district: string;

  @ApiProperty({ description: 'จังหวัด', example: 'กรุงเทพมหานคร' })
  @IsString()
  province: string;

  @ApiProperty({ description: 'รหัสไปรษณีย์', example: '10110' })
  @IsString()
  postal_code: string;

  @ApiProperty({ description: 'พื้นที่ใช้สอย (ตร.ม.)', example: 120.5 })
  @IsNumber()
  usable_area: number;
}
