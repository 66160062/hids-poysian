import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateDailyReportRoundDto {
  @ApiProperty({
    description:
      'Inspection team member ID. If omitted, the latest member for the job is used.',
    example: 1,
    required: false,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  teamMemberId?: number;

  @ApiProperty({
    description:
      'Inspector user ID. Used to create a team member when teamMemberId is omitted.',
    example: 1,
    required: false,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @IsOptional()
  inspectorId?: number;

  @ApiProperty({
    description: 'Team ID. Used to assign a team to the round.',
    example: 1,
    required: false,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  teamId?: number;

  @ApiProperty({
    description: 'Scheduled date for the new round',
    example: '2026-03-19',
  })
  @Type(() => Date)
  @IsDate()
  scheduledDate: Date;

  @ApiProperty({
    description: 'Round status',
    example: 'SCHEDULED',
    required: false,
  })
  @IsString()
  @IsOptional()
  status?: string;
}
