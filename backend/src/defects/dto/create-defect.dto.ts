import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsString, IsOptional, MaxLength, IsArray, ArrayNotEmpty } from "class-validator";
export class CreateDefectDto {
    @ApiProperty({ description: 'รหัสรอบการตรวจ', example: 1 })
    @IsInt()
    @IsNotEmpty()
    roundId!: number;

    @ApiProperty({ description: 'รหัสผู้ตรวจที่พบ Defect นี้', example: 99 })
    @IsInt()
    @IsNotEmpty()
    inspectorId!: number;

    @ApiProperty({ description: 'รหัสห้อง', example: 10 })
    @IsInt()
    @IsNotEmpty()
    templateId!: number;

    @ApiProperty({ 
        description: 'รหัสหมวดหมู่ Defects',
        example: [5, 6, 8],
        type: [Number]
    })
    @IsArray()
    @ArrayNotEmpty()
    @IsInt({ each: true })
    subCategoryIds!: number[];

    @ApiProperty({ description: 'รายละเอียดของข้อบกพร่อง', example: 'ผนังมีรอยร้าวยาวประมาณ 10 ซม.' })
    @IsString()
    @IsNotEmpty()
    description!: string;

    @ApiProperty({ description: 'ระดับความรุนแรง', example: 'Major' })
    @IsString()
    @MaxLength(50)
    @IsNotEmpty()
    severity!: string;

    @ApiPropertyOptional({ description: 'ลิงก์รูปภาพจุดที่เกิด Defect', example: 'https://example.com/defect-01.jpg' })
    @IsString()
    @MaxLength(255)
    @IsOptional()
    imageUrl?: string;

    @ApiPropertyOptional({ description: 'ขนาดไฟล์รูปภาพ (Byte)', example: 204800 })
    @IsInt()
    @IsOptional()
    imageFileSize?: number;

    @ApiPropertyOptional({ description: 'สถานะการแก้ไข', example: 'Pending', default: 'Pending' })
    @IsString()
    @MaxLength(50)
    @IsOptional()
    status?: string;
}