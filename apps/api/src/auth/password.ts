import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

const pattern = /^scrypt\$([a-f0-9]{32})\$([a-f0-9]{128})$/;
export function isPasswordHash(value: string): boolean {
  return pattern.test(value);
}

function derive(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(
      password,
      salt,
      64,
      { N: 65536, r: 8, p: 1, maxmem: 128 * 1024 * 1024 },
      (error, key) => {
        if (error) reject(error);
        else resolve(key);
      },
    );
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt);
  return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  const parts = pattern.exec(hash);
  if (!parts) return false;
  const actual = await derive(password, Buffer.from(parts[1], 'hex'));
  return timingSafeEqual(actual, Buffer.from(parts[2], 'hex'));
}
