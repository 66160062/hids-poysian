import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export const TRANSLATE_TARGETS = ['en', 'th'] as const;
export type TranslateTarget = (typeof TRANSLATE_TARGETS)[number];

export class TranslateTextDto {
  @ApiProperty({ example: 'ห้องนอนใหญ่' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  text!: string;

  @ApiProperty({ enum: TRANSLATE_TARGETS, example: 'en' })
  @IsIn(TRANSLATE_TARGETS)
  target!: TranslateTarget;
}
