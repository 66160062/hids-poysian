import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

const LINK_TOKEN_EXPIRES_IN_SECONDS = 15 * 60;

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new UnauthorizedException('รหัสผ่านไม่ถูกต้อง');
    return user;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
      },
    };
  }

  async generateLinkToken(projectId: number, role: string) {
    if (!role) {
      throw new BadRequestException('role is required');
    }

    const expiresAt =
      Math.floor(Date.now() / 1000) + LINK_TOKEN_EXPIRES_IN_SECONDS;
    const payload = {
      project_id: projectId,
      role,
    };
    const token = await this.jwtService.signAsync(payload, {
      expiresIn: LINK_TOKEN_EXPIRES_IN_SECONDS,
    });
    const baseUrl = process.env.LINK_BASE_URL ?? 'http://localhost:3000';
    const url = `${baseUrl.replace(/\/$/, '')}/auth/verify-link?token=${encodeURIComponent(token)}`;

    return {
      token,
      url,
      expires_at: expiresAt,
    };
  }

  async verifyLinkToken(token: string) {
    if (!token) {
      throw new UnauthorizedException('Token not found');
    }

    return this.jwtService.verifyAsync(token);
  }
}
