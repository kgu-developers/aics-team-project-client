import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const bundleOnly = process.argv.includes('--bundle-only');
const errors = [];
let releaseCommit = '';
let productionApiBaseUrl = '';

function runGit(args) {
  try {
    return execFileSync('git', args, {
      cwd: repoRoot,
      encoding: 'utf8',
      env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
      timeout: args[0] === 'fetch' ? 30_000 : 10_000,
    }).trim();
  } catch {
    errors.push(`git ${args.join(' ')} 명령을 실행하지 못했습니다.`);
    return '';
  }
}

function collectBundleFiles(directory) {
  if (!existsSync(directory)) return [];

  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) return collectBundleFiles(path);
    if (!['.css', '.html', '.js', '.map', '.mjs'].includes(extname(path))) {
      return [];
    }

    return [path];
  });
}

if (!bundleOnly) {
  runGit(['fetch', 'origin']);

  const branch = runGit(['branch', '--show-current']);
  const status = runGit(['status', '--porcelain', '--untracked-files=all']);
  const head = runGit(['rev-parse', 'HEAD']);
  const originMain = runGit(['rev-parse', 'origin/main']);
  releaseCommit = head;

  if (branch !== 'main') {
    errors.push(
      `현재 브랜치가 main이 아닙니다: ${branch || '(detached HEAD)'}`,
    );
  }
  if (status) {
    errors.push(
      '작업 디렉터리에 커밋되지 않았거나 추적되지 않은 변경이 있습니다.',
    );
  }
  if (head && originMain && head !== originMain) {
    errors.push('HEAD와 최신 origin/main이 같은 커밋이 아닙니다.');
  }
}

const productionEnvPath = join(repoRoot, 'apps/oop/.env.production');
const localEnvOverrides = [
  'apps/oop/.env',
  'apps/oop/.env.local',
  'apps/oop/.env.production.local',
].filter(path => existsSync(join(repoRoot, path)));

if (localEnvOverrides.length > 0) {
  errors.push(
    `운영 빌드를 덮어쓸 수 있는 로컬 env 파일이 있습니다: ${localEnvOverrides.join(', ')}`,
  );
}

if (!existsSync(productionEnvPath)) {
  errors.push('apps/oop/.env.production 파일이 없습니다.');
} else {
  const productionEnv = readFileSync(productionEnvPath, 'utf8');
  const assignments = productionEnv
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'));
  const parsedAssignments = assignments.map(line =>
    line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/),
  );

  if (parsedAssignments.some(assignment => !assignment)) {
    errors.push('apps/oop/.env.production에 해석할 수 없는 줄이 있습니다.');
  }

  const keys = parsedAssignments
    .map(assignment => assignment?.[1])
    .filter(Boolean);
  const unexpectedKeys = keys.filter(key => key !== 'VITE_API_BASE_URL');

  if (unexpectedKeys.length > 0) {
    errors.push(
      `apps/oop/.env.production에 승인되지 않은 키가 있습니다: ${unexpectedKeys.join(', ')}`,
    );
  }
  if (new Set(keys).size !== keys.length) {
    errors.push('apps/oop/.env.production에 중복된 환경변수 키가 있습니다.');
  }

  productionApiBaseUrl =
    parsedAssignments
      .find(assignment => assignment?.[1] === 'VITE_API_BASE_URL')?.[2]
      ?.trim() ?? '';

  try {
    const url = new URL(productionApiBaseUrl);
    if (url.protocol !== 'https:') {
      errors.push('VITE_API_BASE_URL은 HTTPS 주소여야 합니다.');
    }
    if (url.username || url.password || url.search || url.hash) {
      errors.push(
        'VITE_API_BASE_URL에는 자격 증명, 쿼리 문자열, fragment를 넣을 수 없습니다.',
      );
    }
  } catch {
    errors.push('VITE_API_BASE_URL이 없거나 올바른 URL이 아닙니다.');
  }
}

const ambientViteKeys = Object.keys(process.env).filter(key =>
  key.startsWith('VITE_'),
);
const unexpectedAmbientViteKeys = ambientViteKeys.filter(
  key => key !== 'VITE_API_BASE_URL',
);

if (unexpectedAmbientViteKeys.length > 0) {
  errors.push(
    `운영 빌드를 덮어쓸 수 있는 셸 환경변수가 있습니다: ${unexpectedAmbientViteKeys.join(', ')}`,
  );
}
if (
  process.env.VITE_API_BASE_URL &&
  process.env.VITE_API_BASE_URL !== productionApiBaseUrl
) {
  errors.push('셸의 VITE_API_BASE_URL이 apps/oop/.env.production과 다릅니다.');
}

const oopPackagePath = join(repoRoot, 'apps/oop/package.json');
if (!existsSync(oopPackagePath)) {
  errors.push('apps/oop/package.json 파일이 없습니다.');
} else {
  const oopPackage = JSON.parse(readFileSync(oopPackagePath, 'utf8'));
  const deployScript = oopPackage.scripts?.deploy ?? '';
  const expectedDeployScript =
    'pnpm build && node ../../.agent/scripts/check-oop-deploy-readiness.mjs && wrangler pages deploy ./dist --project-name aics-oop --branch main --profile kgu-oop';

  if (deployScript !== expectedDeployScript) {
    errors.push(
      'apps/oop의 deploy 스크립트가 승인된 Pages 대상 또는 사전 점검을 보장하지 않습니다.',
    );
  }
}

const distDirectory = join(repoRoot, 'apps/oop/dist');
const indexPath = join(distDirectory, 'index.html');
if (!existsSync(indexPath)) {
  errors.push(
    'apps/oop/dist/index.html이 없습니다. 먼저 운영 빌드를 실행하세요.',
  );
}

const devtoolsMarkers = [
  'Open TanStack Router Devtools',
  'TanStackRouterDevtools',
  'tanstackRouterDevtoolsOpen',
];
const bundleFiles = collectBundleFiles(distDirectory);
const exposedFiles = bundleFiles.filter(path => {
  const contents = readFileSync(path, 'utf8');
  return devtoolsMarkers.some(marker => contents.includes(marker));
});
const productionApiIsEmbedded =
  productionApiBaseUrl &&
  bundleFiles.some(path =>
    readFileSync(path, 'utf8').includes(productionApiBaseUrl),
  );

if (exposedFiles.length > 0) {
  errors.push(
    `운영 번들에 TanStack Router Devtools 코드가 남아 있습니다 (${exposedFiles.length}개 파일).`,
  );
}
if (!productionApiIsEmbedded) {
  errors.push(
    '운영 번들에서 apps/oop/.env.production의 API 주소를 찾지 못했습니다.',
  );
}

if (errors.length > 0) {
  console.error('OOP 운영 배포 사전 점검 실패:');
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(
    `OK: 운영 번들 ${bundleFiles.length}개 파일에서 Router Devtools 노출이 없습니다.`,
  );
  if (bundleOnly) {
    console.log(
      'OK: 번들 전용 점검 완료 (이 결과만으로 운영 배포할 수는 없습니다).',
    );
  } else {
    console.log(`OK: clean main ${releaseCommit.slice(0, 7)} 배포 준비 완료.`);
  }
}
