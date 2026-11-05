import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const allowedEnv = new Map([
  [
    'apps/oop/.env.example',
    ['VITE_API_BASE_URL', 'VITE_API_PROXY_TARGET', 'VITE_OPEN_CHAT_URL'],
  ],
  [
    'apps/oop/.env.development',
    ['VITE_API_BASE_URL', 'VITE_API_PROXY_TARGET', 'VITE_OPEN_CHAT_URL'],
  ],
  ['apps/oop/.env.production', ['VITE_API_BASE_URL', 'VITE_OPEN_CHAT_URL']],
]);
const status = execFileSync('git', ['status', '--porcelain', '-z'], {
  encoding: 'utf8',
})
  .split('\0')
  .filter(Boolean);
const suspicious = [];
for (const entry of status) {
  const file = entry.slice(3).replaceAll('\\', '/');
  if (file.includes('.agent-local') || file.includes('node_modules'))
    suspicious.push(file);
  if (!file.includes('.env')) continue;
  const allowed = allowedEnv.get(file);
  if (!allowed) {
    suspicious.push(file);
    continue;
  }
  if (entry.slice(0, 2).includes('D')) continue;
  const assignments = readFileSync(file, 'utf8')
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'));
  const seen = new Set();
  for (const line of assignments) {
    const match = /^([A-Z][A-Z0-9_]*)=(.*)$/.exec(line);
    if (!match || !allowed.includes(match[1]) || seen.has(match[1])) {
      suspicious.push(file);
      continue;
    }
    seen.add(match[1]);
    if (match[2]) {
      try {
        const url = new URL(match[2]);
        if (url.username || url.password || url.search || url.hash)
          suspicious.push(file);
      } catch {
        suspicious.push(file);
      }
    }
  }
}
if (suspicious.length) {
  console.error('Review local/private or invalid public env paths:');
  for (const file of new Set(suspicious)) console.error(`- ${file}`);
  process.exitCode = 1;
} else
  console.log(
    'OK: no local/private paths; changed public env files use approved keys.',
  );
