import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class LinkTokenGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.query?.token;

    if (typeof token !== 'string' || !token) {
      throw new UnauthorizedException('Token not found');
    }

    try {
      request.user = await this.authService.verifyLinkToken(token);
      return true;
    } catch {
      throw new UnauthorizedException('Token invalid or expired');
    }
  }
}
