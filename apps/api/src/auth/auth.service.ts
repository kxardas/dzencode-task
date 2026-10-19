import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { parseCookie } from 'cookie';
import type { Request } from 'express';
import {
  AUTH_CONFIG,
  AUTH_COOKIE,
  SESSION_SECONDS,
  type AuthConfig,
} from './auth.config.js';
import { verifyPassword } from './password.js';

export interface SessionUser {
  username: string;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(AUTH_CONFIG) private readonly config: AuthConfig,
    private readonly jwt: JwtService,
  ) {}

  async login(username: string, password: string): Promise<string> {
    const validPassword = await verifyPassword(
      password,
      this.config.passwordHash,
    );
    if (username !== this.config.username || !validPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.jwt.signAsync(
      { sub: username },
      {
        secret: this.config.secret,
        algorithm: 'HS256',
        issuer: 'orders-products-api',
        audience: 'orders-products-web',
        expiresIn: SESSION_SECONDS,
      },
    );
  }

  async session(request: Request): Promise<SessionUser | null> {
    const token = parseCookie(request.headers.cookie ?? '')[AUTH_COOKIE];
    if (!token) return null;
    try {
      // verifyAsync checks the signature and expiration before we trust the payload.
      const payload = await this.jwt.verifyAsync<{ sub: string; exp: number }>(
        token,
        {
          secret: this.config.secret,
          algorithms: ['HS256'],
          issuer: 'orders-products-api',
          audience: 'orders-products-web',
        },
      );
      if (
        payload.sub !== this.config.username ||
        !Number.isSafeInteger(payload.exp)
      ) {
        return null;
      }
      return { username: payload.sub };
    } catch {
      return null;
    }
  }
}
