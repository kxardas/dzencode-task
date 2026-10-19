import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AuthService } from '../dist/auth/auth.service.js';
import { hashPassword } from '../dist/auth/password.js';
import { AUTH_COOKIE, type AuthConfig } from '../dist/auth/auth.config.js';

export const testPassword = 'Disposable-test-password-2026';
export const testAuthConfig: AuthConfig = {
  username: 'qa',
  passwordHash: await hashPassword(testPassword),
  secret: 'jwt-tests-only-not-a-deployment-secret-2026',
  origin: 'http://localhost:3000',
  secure: false,
};
const cookies = new WeakMap<INestApplication, string>();
export async function authenticateApp(app: INestApplication) {
  const token = await app
    .get(AuthService)
    .login(testAuthConfig.username, testPassword);
  cookies.set(app, `${AUTH_COOKIE}=${token}`);
}
export function authenticatedRequest(app: INestApplication) {
  return request
    .agent(app.getHttpServer())
    .set('Origin', testAuthConfig.origin)
    .set('X-Inventory-Request', '1')
    .set('Cookie', cookies.get(app) ?? '');
}
