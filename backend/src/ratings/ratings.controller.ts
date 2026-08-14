import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { LinkTokenGuard } from 'src/auth/link-token.guard';
import { CreateRatingDto } from './dto/create-rating.dto';
import { RatingsService } from './ratings.service';

type LinkTokenPayload = {
  project_id: number;
  role: string;
};

@Controller('ratings')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post()
  @UseGuards(LinkTokenGuard)
  create(
    @Body() createRatingDto: CreateRatingDto,
    @Req() request: Request & { user: LinkTokenPayload },
  ) {
    return this.ratingsService.create(createRatingDto, request.user);
  }
}
