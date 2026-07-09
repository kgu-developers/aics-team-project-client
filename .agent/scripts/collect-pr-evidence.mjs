import { execSync } from 'node:child_process';

function run(command) {
  return execSync(command, { encoding: 'utf8' }).trim();
}

function runOptional(command) {
  try {
    return run(command);
  } catch {
    return '';
  }
}

function resolveBaseRef() {
  const remoteHead = runOptional(
    'git symbolic-ref --quiet --short refs/remotes/origin/HEAD',
  );
  if (remoteHead) return remoteHead;

  if (runOptional('git rev-parse --verify origin/main')) return 'origin/main';
  if (runOptional('git rev-parse --verify origin/develop'))
    return 'origin/develop';

  return '';
}

const baseRef = resolveBaseRef();
const mergeBase = baseRef ? runOptional(`git merge-base ${baseRef} HEAD`) : '';
const diffRange = mergeBase ? `${mergeBase}...HEAD` : '';
const fallbackRange = 'HEAD~1..HEAD';

console.log('# PR Evidence');
console.log('\n## Branch');
console.log(run('git branch --show-current'));
console.log('\n## Base');
console.log(baseRef || 'unknown');
console.log('\n## Diff range');
console.log(diffRange || fallbackRange);
console.log('\n## Status');
console.log(run('git status --short') || 'clean');
console.log('\n## Changed files');
console.log(
  diffRange
    ? run(`git diff --name-only ${diffRange}`)
    : run(
        `git diff --name-only ${fallbackRange} 2>/dev/null || git diff --name-only`,
      ),
);
console.log('\n## Diff stat');
console.log(
  diffRange
    ? run(`git diff --stat ${diffRange}`)
    : run(`git diff --stat ${fallbackRange} 2>/dev/null || git diff --stat`),
);
