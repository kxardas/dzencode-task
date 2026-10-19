import { readAuthConfig } from './auth.config.js';
import { hashPassword, verifyPassword } from './password.js';

afterEach(() => vi.unstubAllEnvs());
describe('Authentication configuration and passwords', () => {
  it('hashes with distinct salts and verifies only the correct password', async () => {
    const first = await hashPassword('test-password');
    const second = await hashPassword('test-password');
    expect(first).not.toBe(second);
    expect(first).not.toContain('test-password');
    expect(await verifyPassword('test-password', first)).toBe(true);
    expect(await verifyPassword('wrong', first)).toBe(false);
    expect(await verifyPassword('test-password', 'malformed')).toBe(false);
  });
  it('requires configured secrets/hashes and exact HTTPS origins in production', async () => {
    vi.stubEnv('JWT_SECRET', 'x'.repeat(32));
    vi.stubEnv('DEMO_USERNAME', 'evaluator');
    vi.stubEnv('DEMO_PASSWORD_HASH', await hashPassword('test-password'));
    vi.stubEnv('FRONTEND_URL', 'https://inventory.example');
    vi.stubEnv('NODE_ENV', 'production');
    expect(readAuthConfig().secure).toBe(true);
    vi.stubEnv('FRONTEND_URL', 'http://inventory.example');
    expect(() => readAuthConfig()).toThrow();
    vi.stubEnv('FRONTEND_URL', 'https://inventory.example/');
    expect(() => readAuthConfig()).toThrow();
    vi.stubEnv('FRONTEND_URL', 'https://inventory.example');
    vi.stubEnv('JWT_SECRET', 'short');
    expect(() => readAuthConfig()).toThrow('Configure');
  });
});
