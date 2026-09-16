import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createStageRunner } from './stages.ts';

async function run(failed, evidenceFails = false) {
  const executed = [];
  const runner = createStageRunner({
    execute: async (id, _title, action) => {
      executed.push(id);
      await action();
    },
    capture: async () => {
      if (evidenceFails) throw new Error('screenshot failed');
    },
    persist: async () => {
      if (evidenceFails) throw new Error('disk failed');
    },
  });
  const order = [
    '01',
    '02',
    '03',
    '04',
    '05',
    '06',
    ...Array.from(
      { length: 12 },
      (_, i) => `M${String(i + 1).padStart(2, '0')}`,
    ),
    ...Array.from({ length: 4 }, (_, i) => `N0${i + 1}`),
    ...Array.from({ length: 12 }, (_, i) => String(i + 7).padStart(2, '0')),
  ];
  for (const id of order)
    await runner.phase(id, id, async () => {
      if (failed.includes(id)) throw new Error(`${id} rejected`);
    });
  return { ...runner, executed };
}
for (const failed of [['05'], ['06'], ['M01'], ['N01']]) {
  test(`${failed} failure preserves independent branches`, async () => {
    const result = await run(failed);
    const expected =
      failed[0] === '05' || failed[0] === '06'
        ? ['M01', 'M10', 'N01', 'N04', '17']
        : failed[0] === 'M01'
          ? ['N01', 'N04', '07', '14', '18']
          : ['M01', 'M10', '07', '14', '18'];
    for (const id of expected) assert.ok(result.executed.includes(id), id);
    assert.equal(
      result.outcomes.find(item => item.id === failed[0]).status,
      'failed',
    );
  });
}
test('edit failure permits final delete and admin deletion evidence, skips updated reads', async () => {
  const result = await run(['M07']);
  for (const id of ['M10', 'M11', 'M12'])
    assert.ok(result.executed.includes(id));
  for (const id of ['M08', 'M09'])
    assert.equal(
      result.outcomes.find(item => item.id === id).status,
      'skipped',
    );
});
test('enrollment failure preserves milestone preparation and admin notice create/edit', async () => {
  const result = await run(['02']);
  assert.deepEqual(result.executed, ['01', '02', '05', 'N01', 'N03']);
  for (const id of ['N02', 'N04'])
    assert.equal(
      result.outcomes.find(item => item.id === id).status,
      'skipped',
    );
});
test('section creation failure blocks all notice stages; student read failure does not block edits', async () => {
  const noSection = await run(['01']);
  for (const id of ['N01', 'N02', 'N03', 'N04'])
    assert.equal(
      noSection.outcomes.find(item => item.id === id).status,
      'skipped',
    );
  const unreadFailed = await run(['N02']);
  for (const id of ['N03', 'N04'])
    assert.equal(
      unreadFailed.outcomes.find(item => item.id === id).status,
      'passed',
    );
});
test('screenshot and persistence errors cannot suppress siblings', async () => {
  const result = await run(['M04'], true);
  for (const id of ['M10', 'N01', '07', '18'])
    assert.ok(result.executed.includes(id));
  assert.ok(result.evidenceErrors.length > 0);
});
test('explicit IDs do not collide; unknown and duplicate IDs are rejected', async () => {
  const result = await run([]);
  assert.equal(result.outcomes.length, 34);
  assert.equal(
    result.outcomes.filter(item => ['M01', 'M10'].includes(item.id)).length,
    2,
  );
  await assert.rejects(
    result.phase('M01', 'duplicate', async () => {}),
    /duplicate/,
  );
  await assert.rejects(
    result.phase('missing', 'unknown', async () => {}),
    /Unknown/,
  );
  assert.throws(
    () => createStageRunner({ graph: { one: ['absent'] } }),
    /Invalid dependency/,
  );
});
