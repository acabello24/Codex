import { randomBytes } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { people } from '../app/domain.mjs';

const args = process.argv.slice(2);
const get = (flag, fallback) => args.includes(flag) ? args[args.indexOf(flag) + 1] : fallback;
mkdirSync('.aurora', { recursive: true, mode: 0o700 });
let credentials;
try { credentials = JSON.parse(readFileSync('.aurora/dev-access.json', 'utf8')); }
catch (error) {
  if (error.code !== 'ENOENT') throw error;
  credentials = {
    secret: randomBytes(32).toString('base64url'),
    accounts: Object.fromEntries(people.map(person => [person.id, randomBytes(20).toString('base64url')])),
  };
  writeFileSync('.aurora/dev-access.json', JSON.stringify(credentials, null, 2), { mode: 0o600 });
}
await import('./build.mjs');
console.log('Códigos locales en .aurora/dev-access.json');
const child = spawn(process.execPath, ['app/server.mjs'], {
  stdio: 'inherit',
  env: {
    ...process.env, HOST: get('--host', '127.0.0.1'), PORT: get('--port', '3000'),
    AURORA_ACCOUNTS: JSON.stringify(credentials.accounts), AURORA_SESSION_SECRET: credentials.secret,
  },
});
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => child.kill(signal));
child.on('exit', code => { process.exitCode = code ?? 0; });
