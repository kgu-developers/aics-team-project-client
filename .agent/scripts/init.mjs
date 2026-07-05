import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dirs = [
  '.agent-local/task-cards',
  '.agent-local/worklogs',
  '.agent-local/pr-drafts',
  '.agent-local/review-fixes',
  '.agent-local/screenshots',
  '.agent-local/proposals',
  '.agent-local/coaching-notes',
];

for (const dir of dirs) mkdirSync(dir, { recursive: true });

const readme = join('.agent-local', 'README.md');
if (!existsSync(readme)) {
  writeFileSync(
    readme,
    `# .agent-local

Local-only workspace for KD/AICS agent work. Do not commit this directory.

Use these folders:

- task-cards/
- worklogs/
- pr-drafts/
- review-fixes/
- screenshots/
- proposals/
- coaching-notes/
`,
  );
}

const ignored = execSync(
  'git check-ignore .agent-local/probe.tmp 2>/dev/null || true',
  {
    encoding: 'utf8',
  },
).trim();

if (!ignored) {
  console.error(
    'ERROR: .agent-local/* is not ignored. Add .agent-local/ to .gitignore.',
  );
  process.exitCode = 1;
} else {
  console.log('Initialized .agent-local workspace.');
  console.log(`OK: ${ignored} is ignored.`);
}
