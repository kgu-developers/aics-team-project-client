import { spawnSync } from 'node:child_process';

const result = spawnSync('git', ['check-ignore', '.agent-local/probe.tmp'], {
  encoding: 'utf8',
});
if (result.status === 0) console.log('OK: .agent-local/ is ignored.');
else {
  console.error(
    result.status === 1
      ? 'ERROR: .agent-local/ must be ignored.'
      : 'ERROR: could not inspect Git ignore rules.',
  );
  process.exitCode = 1;
}
