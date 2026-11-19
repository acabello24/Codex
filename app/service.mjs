import { createTicket, DomainError, importClients, initialState, people, readClients, setAvailability, snapshot, updateTicket } from './domain.mjs';

const encoder = new TextEncoder();
const cookieName = 'aurora_session';
const duration = 8 * 60 * 60;
const bytesToHex = bytes => [...new Uint8Array(bytes)].map(value => value.toString(16).padStart(2, '0')).join('');
const digest = async value => bytesToHex(await crypto.subtle.digest('SHA-256', encoder.encode(value)));

function equal(left, right) {
  let delta = left.length ^ right.length;
  for (let index = 0; index < left.length; index++) delta |= left.charCodeAt(index) ^ (right.charCodeAt(index) || 0);
  return delta === 0;
}

async function signature(secret, value) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return bytesToHex(await crypto.subtle.sign('HMAC', key, encoder.encode(value)));
}

async function identity(request, secret) {
  const cookie = request.headers.get('cookie')?.split(/;\s*/).find(part => part.startsWith(cookieName + '='));
  if (!cookie) return null;
  const [id, expiry, mac, extra] = cookie.slice(cookieName.length + 1).split('.');
  if (extra !== undefined || !/^\d{10}$/.test(expiry) || Number(expiry) <= Date.now() / 1000 || !/^[a-f0-9]{64}$/.test(mac)) return null;
  if (!equal(await signature(secret, id + '.' + expiry), mac)) return null;
  return people.find(person => person.id === id) ?? null;
}

function cookie(request, value, maxAge) {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return cookieName + '=' + value + '; Path=/; HttpOnly; SameSite=Strict; Max-Age=' + maxAge + secure;
}

function json(data, status = 200, headers = {}) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers } });
}

async function readBody(request) {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new DomainError('Se esperaba JSON.', 415);
  const reader = request.body?.getReader();
  if (!reader) throw new DomainError('La solicitud está vacía.');
  const decoder = new TextDecoder();
  let size = 0, text = '';
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 1_500_000) {
        await reader.cancel();
        throw new DomainError('El archivo supera el tamaño permitido.', 413);
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    const value = JSON.parse(text);
    if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new Error();
    return value;
  } catch (error) {
    if (error instanceof DomainError) throw error;
    throw new DomainError('La solicitud contiene JSON inválido.');
  }
}

export function createService({ store, accounts, secret, html, demo, siteUsers }) {
  if (!siteUsers && (typeof secret !== 'string' || secret.length < 32 ||
      !people.every(person => typeof accounts?.[person.id] === 'string' && accounts[person.id].length >= 16) ||
      new Set(people.map(person => accounts[person.id])).size !== people.length)) {
    throw new Error('Configura una clave de sesión y cinco códigos individuales distintos.');
  }
  const credentials = siteUsers ? null : Object.fromEntries(people.map(person => [person.id, digest(accounts[person.id])]));
  const fallback = siteUsers ? null : digest(secret);
  function siteIdentity(request) {
    const id = request.headers.get('oai-authenticated-user-id');
    const email = request.headers.get('oai-authenticated-user-email')?.toLowerCase();
    if (!id || !email || !Object.hasOwn(siteUsers, email)) return null;
    return people.find(person => person.id === siteUsers[email]) ?? null;
  }
  async function mutate(operation) {
    for (let attempt = 0; attempt < 12; attempt++) {
      const { version, state } = await store.read();
      const result = operation(state);
      if (await store.write(version, state)) return result;
    }
    throw new DomainError('Hay varias operaciones en curso. Intenta guardar de nuevo.', 409);
  }
  const htmlHeaders = {
    'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin',
    'Content-Security-Policy': "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'self'",
  };

  return async function handle(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    try {
      if (method === 'GET' && path === '/') return new Response(html, { headers: htmlHeaders });
      if (method === 'GET' && path === '/demo.html') {
        return new Response(demo, { headers: { ...htmlHeaders, 'Content-Disposition': 'attachment; filename="aurora-demo.html"' } });
      }
      if (!path.startsWith('/api/')) return json({ error: 'Página no encontrada.' }, 404);
      if (method !== 'GET' && request.headers.get('origin') !== url.origin) {
        throw new DomainError('La solicitud debe provenir de esta aplicación.', 403);
      }
      if (!siteUsers && method === 'POST' && path === '/api/login') {
        const { user, password } = await readBody(request);
        const person = people.find(entry => entry.id === user);
        const code = typeof password === 'string' && password.length <= 256 ? password : '';
        const expected = person ? credentials[person.id] : fallback;
        if (!equal(await digest(code), await expected) || !person) throw new DomainError('Cuenta o código de acceso inválidos.', 401);
        const value = person.id + '.' + (Math.floor(Date.now() / 1000) + duration);
        return json({ actor: person }, 200, { 'Set-Cookie': cookie(request, value + '.' + await signature(secret, value), duration) });
      }
      if (!siteUsers && method === 'POST' && path === '/api/logout') {
        return json({}, 200, { 'Set-Cookie': cookie(request, '', 0) });
      }
      const actor = siteUsers ? siteIdentity(request) : await identity(request, secret);
      if (!actor) throw new DomainError('Inicia sesión para continuar.', 401);
      if (method === 'GET' && path === '/api/state') return json(snapshot((await store.read()).state, actor));
      if (method === 'POST' && path === '/api/tickets') {
        const input = await readBody(request);
        const ticket = await mutate(state => createTicket(state, actor, input));
        return json({ id: ticket.id, agent: ticket.agent }, 201);
      }
      if (method === 'PATCH' && /^\/api\/tickets\/AUR-\d{6}-\d{4}$/.test(path)) {
        const input = await readBody(request);
        const ticket = await mutate(state => updateTicket(state, actor, path.split('/').at(-1), input));
        return json({ id: ticket.id, version: ticket.version });
      }
      if (method === 'POST' && path === '/api/clients/import') {
        if (actor.role !== 'coordinator') throw new DomainError('Solo el coordinador puede importar clientes.', 403);
        const { filename, raw } = await readBody(request);
        if (typeof filename !== 'string' || typeof raw !== 'string') throw new DomainError('Selecciona un archivo válido.');
        const rows = readClients(filename, raw);
        return json(await mutate(state => importClients(state, actor, rows)));
      }
      if (method === 'POST' && path === '/api/availability') {
        const { id, available } = await readBody(request);
        await mutate(state => setAvailability(state, actor, id, available));
        return json({});
      }
      return json({ error: 'Operación no encontrada.' }, 404);
    } catch (error) {
      if (error instanceof DomainError) return json({ error: error.message }, error.status);
      console.error(error);
      return json({ error: 'No se pudo completar la operación. Intenta de nuevo.' }, 500);
    }
  };
}

export const schema = 'CREATE TABLE IF NOT EXISTS aurora_state (id INTEGER PRIMARY KEY CHECK (id = 1), version INTEGER NOT NULL, payload TEXT NOT NULL)';
export function seed() { return JSON.stringify(initialState()); }
