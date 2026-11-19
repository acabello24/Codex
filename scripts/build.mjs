import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';

const read = file => readFileSync(file, 'utf8');
function bundle(file) {
  return read(file).replace(/^import .* from '\.\/.*';\n/gm, '').replace(/^export (?=(const|function|class) )/gm, '');
}
const template = read('app/page.html');
const style = read('app/style.css');
const domain = bundle('app/domain.mjs');
const browser = bundle('app/browser.mjs');
const makePage = mode => template.replace('<html lang="es">', '<html lang="es" data-mode="' + mode + '">')
  .replace('/* CSS */', () => style)
  .replace('/* JS */', () => '(() => {\n' + domain + '\n' + browser.replace('const nameOf =', 'const displayNameOf =').replace(/\bnameOf\(/g, 'displayNameOf(') + '\n})();');
const html = makePage('shared');
const demo = makePage('demo');
mkdirSync('dist', { recursive: true });
writeFileSync('dist/index.html', html);
writeFileSync('dist/demo.html', demo);
mkdirSync('dist/server', { recursive: true });
writeFileSync('dist/server/index.js', [
  domain, bundle('app/service.mjs'),
  'const HOSTED_HTML = ' + JSON.stringify(makePage('hosted')) + ';',
  'const DEMO_HTML = ' + JSON.stringify(demo) + ';',
  bundle('app/worker.mjs'),
].join('\n'));
mkdirSync('dist/.openai', { recursive: true });
writeFileSync('dist/.openai/hosting.json', read('.openai/hosting.json'));
mkdirSync('dist/migrations', { recursive: true });
writeFileSync('dist/migrations/0001_aurora.sql', read('drizzle/0001_aurora.sql'));
writeFileSync('dist/server/wrangler.json', JSON.stringify({
  name: 'comercial-aurora-piloto', main: 'index.js', compatibility_date: '2026-11-19',
  d1_databases: [{ binding: 'DB', database_name: 'aurora', database_id: 'local', migrations_dir: '../../drizzle' }],
}));
