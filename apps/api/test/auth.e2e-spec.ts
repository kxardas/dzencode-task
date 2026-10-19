import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { AppModule } from '../dist/app.module.js';
import { AuthService } from '../dist/auth/auth.service.js';
import type { Request } from 'express';
import { PrismaService } from '../dist/prisma/prisma.service.js';
import {
  AUTH_CONFIG,
  AUTH_COOKIE,
  cookieOptions,
} from '../dist/auth/auth.config.js';
import { testAuthConfig, testPassword } from './auth-helpers.js';

let app: INestApplication;
let deleteMany: ReturnType<typeof vi.fn>;
let create: ReturnType<typeof vi.fn>;
function trusted() {
  return request
    .agent(app.getHttpServer())
    .set('Origin', testAuthConfig.origin)
    .set('X-Inventory-Request', '1');
}
async function login() {
  const response = await trusted()
    .post('/api/auth/login')
    .send({ username: testAuthConfig.username, password: testPassword })
    .expect(200);
  return {
    response,
    cookie: (response.headers['set-cookie'] as unknown as string[])[0].split(
      ';',
    )[0],
  };
}
beforeEach(async () => {
  deleteMany = vi.fn().mockResolvedValue({ count: 1 });
  create = vi.fn();
  const module = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(AUTH_CONFIG)
    .useValue(testAuthConfig)
    .overrideProvider(PrismaService)
    .useValue({
      order: { deleteMany, findMany: async () => [] },
      product: { create, findMany: async () => [] },
    })
    .compile();
  app = module.createNestApplication({ logger: false });
  app.setGlobalPrefix('api');
  await app.init();
});
afterEach(async () => {
  await app.close();
});

describe('JWT cookie authentication', () => {
  it('accepts a valid JWT after restart without a server session registry', async () => {
    const { cookie } = await login();
    const restarted = new AuthService(testAuthConfig, new JwtService());
    expect(await restarted.session({ headers: { cookie } } as Request)).toEqual(
      { username: 'qa' },
    );
  });
  it('expires an actually issued session after fifteen minutes', async () => {
    const { cookie } = await login();
    vi.useFakeTimers({ toFake: ['Date'] });
    try {
      vi.setSystemTime(Date.now() + 901000);
      await trusted().delete('/api/orders/1').set('Cookie', cookie).expect(401);
      await trusted()
        .get('/api/auth/session')
        .set('Cookie', cookie)
        .expect(200)
        .expect({ data: { user: null } });
      expect(deleteMany).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
  it('keeps reads public and rejects unauthenticated mutations before database access', async () => {
    await request(app.getHttpServer())
      .get('/api/orders')
      .expect(200)
      .expect({ data: [] });
    await request(app.getHttpServer())
      .get('/api/products')
      .expect(200)
      .expect({ data: [] });
    await trusted().delete('/api/orders/1').expect(401);
    await trusted().post('/api/products').send({}).expect(401);
    expect(deleteMany).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it('issues an HttpOnly cookie, restores a session, allows writes, and clears the cookie on logout', async () => {
    const { response, cookie } = await login();
    const header = response.headers['set-cookie'][0];
    expect(header).toContain('HttpOnly');
    expect(header).toContain('SameSite=Lax');
    expect(header).toContain('Path=/api');
    expect(header).toContain('Max-Age=900');
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.body).toEqual({ data: { user: { username: 'qa' } } });
    expect(JSON.stringify(response.body)).not.toContain('token');
    await trusted()
      .get('/api/auth/session')
      .set('Cookie', cookie)
      .expect(200)
      .expect(response.body);
    await trusted().delete('/api/orders/1').set('Cookie', cookie).expect(204);
    expect(deleteMany).toHaveBeenCalledOnce();
    const logout = await trusted()
      .post('/api/auth/logout')
      .set('Cookie', cookie)
      .expect(204);
    expect(logout.headers['set-cookie'][0]).toContain(`${AUTH_COOKIE}=;`);
    await trusted().delete('/api/orders/1').expect(401);
    await trusted()
      .get('/api/auth/session')
      .expect(200)
      .expect({ data: { user: null } });
    // Stateless logout clears the browser cookie; a copied JWT lasts until expiry.
    await trusted()
      .get('/api/auth/session')
      .set('Cookie', cookie)
      .expect(200)
      .expect(response.body);
    await trusted().post('/api/auth/logout').expect(204);
  });

  it('rejects missing/hostile origins and missing custom headers, including login and logout', async () => {
    const { cookie } = await login();
    for (const path of [
      '/api/auth/login',
      '/api/auth/logout',
      '/api/products',
    ]) {
      await request(app.getHttpServer())
        .post(path)
        .set('Cookie', cookie)
        .send({})
        .expect(403);
      await trusted()
        .post(path)
        .set('Origin', 'https://attacker.example')
        .set('Cookie', cookie)
        .send({})
        .expect(403);
      await request(app.getHttpServer())
        .post(path)
        .set('Origin', testAuthConfig.origin)
        .set('Cookie', cookie)
        .send({})
        .expect(403);
    }
    await trusted()
      .delete('/api/orders/1')
      .set('Origin', 'null')
      .set('Cookie', cookie)
      .expect(403);
    expect(deleteMany).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it('rejects malformed, expired, wrong-signature/algorithm/audience and incomplete JWTs', async () => {
    const jwt = new JwtService();
    const options = {
      secret: testAuthConfig.secret,
      issuer: 'orders-products-api',
      audience: 'orders-products-web',
      subject: 'qa',
    };
    const tokens = [
      'broken',
      await jwt.signAsync({}, { ...options, expiresIn: -1 }),
      await jwt.signAsync({}, { ...options, secret: 'wrong', expiresIn: 900 }),
      await jwt.signAsync(
        {},
        { ...options, algorithm: 'HS384', expiresIn: 900 },
      ),
      await jwt.signAsync(
        {},
        { ...options, audience: 'other', expiresIn: 900 },
      ),
      await jwt.signAsync({}, options),
      await jwt.signAsync({}, { ...options, subject: 'other', expiresIn: 900 }),
    ];
    for (const token of tokens) {
      await trusted()
        .delete('/api/orders/1')
        .set('Cookie', `${AUTH_COOKIE}=${token}`)
        .expect(401);
      await trusted()
        .post('/api/products')
        .set('Cookie', `${AUTH_COOKIE}=${token}`)
        .send({})
        .expect(401);
    }
    expect(deleteMany).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it('allows another login without revoking issued JWTs and uses Secure production cookies', async () => {
    const first = await login();
    const next = await trusted()
      .post('/api/auth/login')
      .set('Cookie', first.cookie)
      .send({ username: 'qa', password: testPassword })
      .expect(200);
    await trusted()
      .get('/api/auth/session')
      .set('Cookie', first.cookie)
      .expect(200)
      .expect({ data: { user: { username: 'qa' } } });
    await trusted()
      .get('/api/auth/session')
      .set('Cookie', next.headers['set-cookie'][0].split(';')[0])
      .expect(200)
      .expect({ data: { user: { username: 'qa' } } });
    expect(cookieOptions({ ...testAuthConfig, secure: true }).secure).toBe(
      true,
    );
  });

  it('validates login fields and returns generic credential failures', async () => {
    await trusted().post('/api/auth/login').send({}).expect(400);
    await trusted()
      .post('/api/auth/login')
      .send({ username: 'qa', password: testPassword, role: 'admin' })
      .expect(400);
    for (const username of ['qa', 'unknown']) {
      const result = await trusted()
        .post('/api/auth/login')
        .send({ username, password: 'wrong' })
        .expect(401);
      expect(result.body.message).toBe('Invalid credentials');
    }
    await trusted()
      .post('/api/auth/login')
      .send({ username: 'qa', password: testPassword })
      .expect(200);
  });
});
