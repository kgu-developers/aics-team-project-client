const changed = process.argv.slice(2);

const routes = new Set();

for (const file of changed) {
  if (file.includes('apps/oop/src/app/page')) routes.add('/');
  if (file.includes('apps/oop/src/app/teams')) routes.add('/teams');
  if (file.includes('apps/oop/src/app/projects')) routes.add('/projects');
  if (file.includes('apps/oop/src/app/submissions')) routes.add('/submissions');
}

if (routes.size === 0) routes.add('/');

console.log('Screenshot plan:');
for (const route of routes) {
  console.log(`- ${route}: desktop 1440x900, mobile 390x844`);
}
console.log(
  '- Include empty/loading/error states when the change touches data fetching or status UI.',
);
