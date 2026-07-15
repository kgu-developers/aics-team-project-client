import { execSync } from 'node:child_process';

const changed = execSync(
  'git diff --name-only HEAD 2>/dev/null || git diff --name-only',
  { encoding: 'utf8' },
)
  .split('\n')
  .filter(Boolean);

const commands = new Set(['pnpm lint', 'pnpm build']);

if (changed.length > 0 && changed.every(file => file.startsWith('apps/oop/'))) {
  commands.add('pnpm --filter @aics/oop lint');
  commands.add('pnpm --filter @aics/oop build');
}

console.log('Suggested verification commands:');
for (const command of commands) console.log(`- ${command}`);
