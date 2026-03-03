import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '../interfaces/auth-request.interface';

export function verifyJwtToken(
  token: string,
  jwtService: JwtService,
): JwtPayload {
  return jwtService.verify<JwtPayload>(token, {
    secret: process.env.JWT_SECRET,
  });
}
