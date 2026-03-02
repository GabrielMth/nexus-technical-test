import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import type { User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async createUser(email: string, password: string): Promise<User> {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing)
      throw new BadRequestException('The e-mail has already been registred!');

    const hashed = await bcrypt.hash(password, 10);
    return this.prisma.user.create({ data: { email, password: hashed } });
  }

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('User not found!');

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new UnauthorizedException('Password incorrect!');

    return user;
  }

  generateTokens(user: Pick<User, 'id' | 'email'>): {
    accessToken: string;
    refreshToken: string;
  } {
    const secret: string = process.env.JWT_SECRET!;
    const refreshSecret: string = process.env.REFRESH_TOKEN_SECRET || secret;

    if (!secret || !refreshSecret)
      throw new Error('JWT_SECRET or REFRESH_TOKEN_SECRET not defined');

    const payload = { sub: user.id, email: user.email };

    const accessToken = jwt.sign(payload, secret, {
      expiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
    } as jwt.SignOptions);
    const refreshToken = jwt.sign(payload, refreshSecret, {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN ?? '7d',
    } as jwt.SignOptions);

    return { accessToken, refreshToken };
  }

  login(user: Pick<User, 'id' | 'email'>) {
    return this.generateTokens(user);
  }
}
