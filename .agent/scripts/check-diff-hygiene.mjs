import { execSync } from 'node:child_process';

const output = execSync('git status --short', { encoding: 'utf8' }).trim();
const suspicious = output
  .split('\n')
  .filter(Boolean)
  .filter(
    line =>
      line.includes('.agent-local') ||
      line.includes('node_modules') ||
      line.includes('.env'),
  );

if (suspicious.length > 0) {
  console.error('Suspicious files in diff:');
  for (const line of suspicious) console.error(`- ${line}`);
  process.exitCode = 1;
} else {
  console.log('OK: no obvious local/private files in git status.');
}
