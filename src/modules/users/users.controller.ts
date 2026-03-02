import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { UsersService } from './users.service';
import type { CreateUserDto } from './dto/request/create-user.schema';
import type { LoginUserDto } from './dto/request/login-user.schema';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CreateUserSchema } from './dto/request/create-user.schema';
import { LoginUserSchema } from './dto/request/login-user.schema';
import { LoginResponseDto } from './dto/response/login-response.dto';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post('register')
  @HttpCode(201)
  async register(
    @Body(new ZodValidationPipe(CreateUserSchema)) body: CreateUserDto,
  ) {
    return this.usersService.createUser(body.email, body.password);
  }

  @Post('login')
  @HttpCode(200)
  async login(
    @Body(new ZodValidationPipe(LoginUserSchema)) body: LoginUserDto,
  ): Promise<LoginResponseDto> {
    const user = await this.usersService.validateUser(
      body.email,
      body.password,
    );
    const tokens = this.usersService.login(user);

    return {
      message: 'Login OK!',
      email: user.email,
      ...tokens,
    };
  }
}
