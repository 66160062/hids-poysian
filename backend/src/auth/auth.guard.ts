import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthGuard implements CanActivate {

    constructor(private jwtService: JwtService) { }

    canActivate(context: ExecutionContext): boolean {

        const request = context.switchToHttp().getRequest();

        const authHeader = request.headers.authorization;

        if (!authHeader) {
            throw new UnauthorizedException('Token not found');
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            throw new UnauthorizedException('Invalid token');
        }

        try {

            const payload = this.jwtService.verify(token, {
                secret: 'secretKey',
            });

            request.user = payload;

            return true;

        } catch (err) {
            throw new UnauthorizedException('Token invalid or expired');
        }
    }
}