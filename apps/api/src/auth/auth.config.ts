import type { CookieOptions } from 'express';
import { isPasswordHash } from './password.js';

export const AUTH_CONFIG = 'INVENTORY_AUTH_CONFIG';
export const AUTH_COOKIE = 'inventory_session';
export const SESSION_SECONDS = 15 * 60;
export interface AuthConfig {
  secret: string;
  username: string;
  passwordHash: string;
  origin: string;
  secure: boolean;
}

export function readAuthConfig(): AuthConfig {
  const secret = process.env.JWT_SECRET ?? '';
  const username = process.env.DEMO_USERNAME ?? '';
  const passwordHash = process.env.DEMO_PASSWORD_HASH ?? '';
  const origin = process.env.FRONTEND_URL ?? 'http://localhost:3000';
  const secure = process.env.NODE_ENV === 'production';
  if (
    Buffer.byteLength(secret) < 32 ||
    !/^[\w.@-]{1,100}$/.test(username) ||
    !isPasswordHash(passwordHash)
  ) {
    throw new Error(
      'Configure JWT_SECRET, DEMO_USERNAME and DEMO_PASSWORD_HASH. See npm run auth:setup.',
    );
  }
  const url = new URL(origin);
  if (
    url.origin !== origin ||
    !['http:', 'https:'].includes(url.protocol) ||
    (secure && url.protocol !== 'https:')
  ) {
    throw new Error(
      'FRONTEND_URL must be an exact origin, using HTTPS in production.',
    );
  }
  return { secret, username, passwordHash, origin, secure };
}

export function cookieOptions(config: AuthConfig): CookieOptions {
  return {
    httpOnly: true,
    secure: config.secure,
    sameSite: 'lax',
    path: '/api',
    maxAge: SESSION_SECONDS * 1000,
  };
}
