import { createServer } from 'node:http';
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { Readable } from 'node:stream';
import { DatabaseSync } from 'node:sqlite';
import { createService, schema, seed } from './service.mjs';

const path = process.env.AURORA_DB || '.aurora/pilot.sqlite';
mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
const db = new DatabaseSync(path);
db.exec('PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;');
db.exec(schema);
if (!db.prepare('SELECT id FROM aurora_state WHERE id = 1').get()) {
  db.prepare('INSERT OR IGNORE INTO aurora_state VALUES (1, 0, ?)').run(seed());
}
const read = db.prepare('SELECT version, payload FROM aurora_state WHERE id = 1');
const write = db.prepare('UPDATE aurora_state SET payload = ?, version = version + 1 WHERE id = 1 AND version = ?');
const store = {
  read() {
    const { version, payload } = read.get();
    return { version, state: JSON.parse(payload) };
  },
  write(version, state) {
    return write.run(JSON.stringify(state), version).changes === 1;
  },
};
const handle = createService({
  store, accounts: JSON.parse(process.env.AURORA_ACCOUNTS || '{}'), secret: process.env.AURORA_SESSION_SECRET,
  html: readFileSync('dist/index.html', 'utf8'), demo: readFileSync('dist/demo.html', 'utf8'),
});
const port = Number(process.env.PORT || 3000);
const publicOrigin = process.env.AURORA_ORIGIN;
createServer(async (incoming, outgoing) => {
  try {
    const origin = publicOrigin || 'http://' + incoming.headers.host;
    const requestUrl = new URL(origin);
    const input = incoming.url || '/';
    const delimiter = input.indexOf('?');
    requestUrl.pathname = delimiter === -1 ? input : input.slice(0, delimiter);
    requestUrl.search = delimiter === -1 ? '' : input.slice(delimiter);
    const init = { method: incoming.method, headers: incoming.headers };
    if (!['GET', 'HEAD'].includes(incoming.method)) Object.assign(init, { body: Readable.toWeb(incoming), duplex: 'half' });
    const response = await handle(new Request(requestUrl, init));
    outgoing.writeHead(response.status, Object.fromEntries(response.headers));
    if (response.body) Readable.fromWeb(response.body).pipe(outgoing);
    else outgoing.end();
  } catch (error) {
    console.error(error);
    if (!outgoing.headersSent) outgoing.writeHead(500);
    outgoing.end();
  }
}).listen(port, process.env.HOST || '127.0.0.1', () => console.log('Aurora disponible en el puerto ' + port));
