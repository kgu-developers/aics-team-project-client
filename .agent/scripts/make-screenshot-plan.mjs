import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const routeDir = resolve(root, 'apps/oop/src/app/routes');
const sources = readdirSync(routeDir)
  .filter(file => /\.tsx?$/.test(file))
  .map(file => ({
    file: `apps/oop/src/app/routes/${file}`,
    source: readFileSync(resolve(routeDir, file), 'utf8'),
  }));
const routes = new Set();
for (const changed of process.argv.slice(2)) {
  if (!changed.startsWith('apps/oop/src/') || changed.includes('.test.'))
    continue;
  const importPath =
    '~/' +
    changed.slice('apps/oop/src/'.length).replace(/(?:\.css)?\.tsx?$/, '');
  for (const route of sources) {
    if (route.file !== changed && !route.source.includes(importPath)) continue;
    const match = /create(?:Lazy)?FileRoute\(['"]([^'"]+)['"]\)/.exec(
      route.source,
    );
    if (match) routes.add(match[1]);
  }
  if (!routes.size) routes.add(/admin/i.test(changed) ? '/admin' : '/student');
}
if (!routes.size) routes.add('/login');
console.log('Screenshot plan:');
for (const route of routes)
  console.log(`- ${route}: desktop 1440x900, mobile 390x844`);
console.log(
  '- Replace route $parameters with IDs from the prepared test dataset; do not invent IDs.',
);
console.log(
  '- Review meaningful loading/empty/error/success states on the common application UI.',
);
