import {
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { InspectionJob } from 'src/inspection-jobs/entities/inspection-job.entity';
import { CreateRatingDto } from './dto/create-rating.dto';
import { Rating } from './entities/rating.entity';

type LinkTokenPayload = {
  project_id: number;
  role: string;
};

@Injectable()
export class RatingsService {
  constructor(
    @InjectRepository(Rating)
    private readonly ratingsRepo: Repository<Rating>,
    @InjectRepository(InspectionJob)
    private readonly jobsRepo: Repository<InspectionJob>,
  ) {}

  async create(createRatingDto: CreateRatingDto, linkPayload: LinkTokenPayload) {
    if (linkPayload.role !== 'customer') {
      throw new ForbiddenException('Only customer links can submit ratings');
    }

    const tokenHash = createHash('sha256')
      .update(createRatingDto.token)
      .digest('hex');
    const existingRating = await this.ratingsRepo.findOneBy({ tokenHash });
    if (existingRating) {
      throw new ConflictException('This link has already submitted a rating');
    }

    const job = await this.jobsRepo.findOneByOrFail({
      jobId: linkPayload.project_id,
    });
    const comment = createRatingDto.comment?.trim() || null;

    try {
      return await this.ratingsRepo.save(
        this.ratingsRepo.create({
          score: createRatingDto.score,
          comment,
          tokenHash,
          job,
        }),
      );
    } catch (error) {
      if (error instanceof QueryFailedError && error.driverError?.code === '23505') {
        throw new ConflictException('This link has already submitted a rating');
      }
      throw error;
    }
  }
}
