import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LinkTokenGuard } from './link-token.guard';
import { AuthGuard } from './auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Get('generate-link')
  @UseGuards(AuthGuard)
  generateLink(
    @Query('project_id', ParseIntPipe) projectId: number,
    @Query('role') role: string,
  ) {
    return this.authService.generateLinkToken(projectId, role);
  }

  @Get('verify-link')
  @UseGuards(LinkTokenGuard)
  verifyLink(
    @Req()
    request: Request & {
      user: { project_id: number; role: string; generation?: number };
    },
  ) {
    return {
      valid: true,
      payload: request.user,
    };
  }
}
