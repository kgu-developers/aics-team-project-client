import { execFileSync } from 'node:child_process';

const changed = [
  ...new Set(
    [
      ...execFileSync('git', ['diff', '--name-only', 'HEAD', '-z'], {
        encoding: 'utf8',
      }).split('\0'),
      ...execFileSync(
        'git',
        ['ls-files', '--others', '--exclude-standard', '-z'],
        { encoding: 'utf8' },
      ).split('\0'),
    ].filter(Boolean),
  ),
];
const commands = new Set(['pnpm lint', 'pnpm build']);
if (
  changed.some(file =>
    /^(apps\/oop\/src|packages\/(core|api-client)\/src)\//.test(file),
  )
) {
  commands.add('pnpm agent:check-msw');
  commands.add('pnpm --filter @aics/oop test:logic');
}
if (
  changed.some(file =>
    /apps\/oop\/(src\/.*\.tsx|vite\.config\.ts|src\/test\/)/.test(file),
  )
)
  commands.add('pnpm --filter @aics/oop test:ui');
if (changed.some(file => file.startsWith('.agent/scripts/')))
  commands.add('node --test .agent/scripts/check-msw-boundary.test.mjs');
console.log('Suggested verification commands:');
for (const command of commands) console.log(`- ${command}`);
console.log(
  'Select relevant tests by changed behavior; live-server E2E is a separate explicit scope.',
);
