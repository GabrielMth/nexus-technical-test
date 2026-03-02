import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { AuthRequest } from '../interfaces/auth-request.interface';
import { verifyJwtToken } from '../utils/jwt.util';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private jwtService: JwtService) {}

  use(req: AuthRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader) throw new UnauthorizedException('Token not found');

    const [bearer, token] = authHeader.split(' ');
    if (bearer !== 'Bearer' || !token)
      throw new UnauthorizedException('Token invalid');

    try {
      const payload = verifyJwtToken(token, this.jwtService);
      req.user = payload;
      next();
    } catch {
      throw new UnauthorizedException('Token expired or invalid');
    }
  }
}
