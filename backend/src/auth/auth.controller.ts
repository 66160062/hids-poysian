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
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LinkTokenGuard } from './link-token.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Get('generate-link')
  generateLink(
    @Query('project_id', ParseIntPipe) projectId: number,
    @Query('role') role: string,
  ) {
    return this.authService.generateLinkToken(projectId, role);
  }

  @Get('verify-link')
  @UseGuards(LinkTokenGuard)
  verifyLink(@Req() request) {
    return {
      valid: true,
      payload: request.user,
    };
  }
}
