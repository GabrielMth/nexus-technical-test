import { Request } from 'express';

export interface JwtPayload {
  sub: string;
  email: string;
}

export interface AuthRequest extends Request {
  user: JwtPayload;
}
