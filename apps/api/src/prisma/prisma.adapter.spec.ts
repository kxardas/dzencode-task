import { createDatabaseAdapter } from './prisma.adapter.js';

describe('database configuration', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('reports a missing connection URL before attempting to connect', () => {
    vi.stubEnv('DATABASE_URL', '');
    expect(() => createDatabaseAdapter()).toThrow('DATABASE_URL is required');
  });

  it.each([
    'not-a-url',
    'postgresql://app:password@localhost/database',
    'mysql://localhost/database',
    'mysql://app:password@localhost',
    'mysql://app:password@localhost/database?ssl=true',
  ])('rejects invalid or unsupported configuration: %s', (databaseUrl) => {
    expect(() => createDatabaseAdapter(databaseUrl)).toThrow(/DATABASE_URL/);
  });

  it('does not include credentials in a configuration error', () => {
    const password = 'private-test-password';
    try {
      createDatabaseAdapter(`postgresql://app:${password}@localhost/database`);
      throw new Error('Invalid configuration was accepted');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain('DATABASE_URL');
      expect((error as Error).message).not.toContain(password);
    }
  });
});
