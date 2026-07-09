import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const localPath = '.agent-local';
const probePath = '.agent-local/probe.tmp';

if (existsSync(localPath)) {
  console.log('.agent-local exists and must remain untracked.');
}

const ignored = execSync(`git check-ignore ${probePath} 2>/dev/null || true`, {
  encoding: 'utf8',
}).trim();

if (!ignored) {
  console.error(
    'ERROR: .agent-local/* is not ignored. Add .agent-local/ to .gitignore before handoff.',
  );
  process.exitCode = 1;
} else {
  console.log(`OK: ${ignored} is ignored.`);
}
