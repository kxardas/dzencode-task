import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Inject,
  Post,
  Req,
  Res,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  AUTH_CONFIG,
  AUTH_COOKIE,
  cookieOptions,
  type AuthConfig,
} from './auth.config.js';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { WriteOriginGuard } from './write-origin.guard.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    @Inject(AUTH_CONFIG) private readonly config: AuthConfig,
  ) {}

  @Get('session')
  @Header('Cache-Control', 'no-store')
  async session(@Req() request: Request) {
    return { data: { user: await this.auth.session(request) } };
  }

  @Post('login')
  @UseGuards(WriteOriginGuard)
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  async login(
    @Body(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    )
    body: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const token = await this.auth.login(body.username, body.password);
    response.cookie(AUTH_COOKIE, token, cookieOptions(this.config));
    return { data: { user: { username: this.config.username } } };
  }

  @Post('logout')
  @UseGuards(WriteOriginGuard)
  @HttpCode(204)
  @Header('Cache-Control', 'no-store')
  logout(@Res({ passthrough: true }) response: Response) {
    const { maxAge: _maxAge, ...options } = cookieOptions(this.config);
    response.clearCookie(AUTH_COOKIE, options);
  }
}
