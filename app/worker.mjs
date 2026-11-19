import { createService, seed } from './service.mjs';

function database(db) {
  return {
    async read() {
      let row = await db.prepare('SELECT version, payload FROM aurora_state WHERE id = 1').first();
      if (!row) {
        await db.prepare('INSERT OR IGNORE INTO aurora_state VALUES (1, 0, ?)').bind(seed()).run();
        row = await db.prepare('SELECT version, payload FROM aurora_state WHERE id = 1').first();
      }
      return { version: row.version, state: JSON.parse(row.payload) };
    },
    async write(version, state) {
      const result = await db.prepare('UPDATE aurora_state SET version = version + 1, payload = ? WHERE id = 1 AND version = ?')
        .bind(JSON.stringify(state), version).run();
      return result.meta.changes === 1;
    },
  };
}

let cached;
export default {
  fetch(request, env) {
    if (!cached || cached.env !== env) {
      cached = {
        env,
        handle: createService({
          store: database(env.DB), siteUsers: JSON.parse(env.AURORA_SITE_USERS || '{}'),
          html: HOSTED_HTML, demo: DEMO_HTML,
        }),
      };
    }
    return cached.handle(request);
  },
};
