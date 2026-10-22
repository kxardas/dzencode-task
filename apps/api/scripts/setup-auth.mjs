import { randomBytes } from 'node:crypto';
import { access, chmod, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { parse } from 'dotenv';
import { hashPassword } from '../dist/auth/password.js';

// An optional output directory lets the Docker setup keep secrets outside the image.
const outputDirectory = process.argv[2]
  ? resolve(process.argv[2])
  : fileURLToPath(new URL('../', import.meta.url));
const envPath = resolve(outputDirectory, '.env');
const accessPath = resolve(outputDirectory, '.auth-local.json');
let source;
try {
  source = await readFile(envPath, 'utf8');
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
  source = '';
}
const env = parse(source);
if (env.JWT_SECRET && env.DEMO_PASSWORD_HASH) {
  console.log(
    'Auth settings already exist; existing credentials were preserved. See README for manual configuration.',
  );
} else {
  if (env.JWT_SECRET || env.DEMO_PASSWORD_HASH)
    throw new Error(
      'Auth settings are incomplete. Complete them manually using README; existing secrets were preserved.',
    );
  try {
    await access(accessPath);
    throw new Error(
      'Local access file already exists. Preserve the matching .env or move the access file before initializing again.',
    );
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const password = randomBytes(18).toString('base64url');
  const username = env.DEMO_USERNAME || 'evaluator';
  const settings = {
    JWT_SECRET: randomBytes(32).toString('hex'),
    DEMO_USERNAME: username,
    DEMO_PASSWORD_HASH: await hashPassword(password),
  };
  for (const [name, value] of Object.entries(settings)) {
    const line = new RegExp(`^${name}=.*$`, 'm');
    source = line.test(source)
      ? source.replace(line, `${name}='${value}'`)
      : `${source}\n${name}='${value}'\n`;
  }
  await writeFile(envPath, source, { mode: 0o600 });
  await chmod(envPath, 0o600);
  await writeFile(
    accessPath,
    `${JSON.stringify({ username, password }, null, 2)}\n`,
    { mode: 0o600, flag: 'wx' },
  );
  console.log(
    `Authentication configured. Read ${accessPath} for evaluator access; keep it private and out of Git.`,
  );
}
