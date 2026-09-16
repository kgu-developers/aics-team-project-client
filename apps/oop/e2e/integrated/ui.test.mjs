import assert from 'node:assert/strict';
import { test } from 'node:test';

import { choose } from './ui.ts';

test('choose re-queries the exact section option after a detached click without reopening the combobox', async () => {
  let opened = 0;
  let optionQueries = 0;
  let selected = false;
  const page = {
    getByRole: (role, options) => {
      if (role === 'combobox') {
        assert.deepEqual(options, { name: '분반', exact: true });
        return { click: async () => opened++ };
      }
      assert.equal(role, 'option');
      assert.deepEqual(options, { name: 'E2E249-section', exact: true });
      const detached = ++optionQueries === 1;
      return {
        click: async options => {
          assert.ok(options.timeout > 0 && options.timeout < 15_000);
          assert.equal(options.force, undefined);
          if (detached) throw new Error('Element was detached from the DOM');
          selected = true;
        },
      };
    },
  };
  await choose(page, '분반', 'E2E249-section');
  assert.equal(opened, 1);
  assert.equal(optionQueries, 2);
  assert.equal(selected, true);
});

test('choose preserves locator-scoped comboboxes and page-level regex options on first-click success', async () => {
  const label = /^조회할 분반/;
  const option = /E2E249-section/;
  let opened = 0;
  let selected = 0;
  const page = {
    getByRole: (role, options) => {
      assert.equal(role, 'option');
      assert.deepEqual(options, { name: option, exact: false });
      return { click: async () => selected++ };
    },
  };
  const scope = {
    page: () => page,
    getByRole: (role, options) => {
      assert.equal(role, 'combobox');
      assert.deepEqual(options, { name: label, exact: false });
      return { click: async () => opened++ };
    },
  };
  await choose(scope, label, option);
  assert.equal(opened, 1);
  assert.equal(selected, 1);
});
