import assert from 'node:assert/strict';
import { test } from 'node:test';

import { choose } from './ui.ts';

for (const closesOnDetach of [true, false]) {
  test(`choose re-queries the exact option after detachment and ${closesOnDetach ? 'reopens a closed dropdown' : 'keeps an available dropdown open'}`, async () => {
    let opened = 0;
    let isOpen = false;
    let optionQueries = 0;
    let clickAttempts = 0;
    let selected = false;
    const page = {
      getByRole: (role, options) => {
        if (role === 'combobox') {
          assert.deepEqual(options, { name: '분반', exact: true });
          return {
            click: async () => {
              opened++;
              isOpen = !isOpen;
            },
          };
        }
        assert.equal(role, 'option');
        assert.deepEqual(options, { name: 'E2E249-section', exact: true });
        optionQueries++;
        return {
          isVisible: async () => isOpen,
          click: async options => {
            assert.ok(options.timeout > 0 && options.timeout < 15_000);
            assert.equal(options.force, undefined);
            assert.ok(
              isOpen,
              'option cannot be selected while the dropdown is closed',
            );
            if (++clickAttempts === 1) {
              isOpen = !closesOnDetach;
              throw new Error('Element was detached from the DOM');
            }
            selected = true;
          },
        };
      },
    };
    await choose(page, '분반', 'E2E249-section');
    assert.equal(opened, closesOnDetach ? 2 : 1);
    assert.equal(optionQueries, closesOnDetach ? 3 : 2);
    assert.equal(clickAttempts, 2);
    assert.equal(selected, true);
  });
}

for (const detached of [false, true]) {
  test(`choose preserves locator scopes and regex semantics ${detached ? 'when reopening' : 'on first-click success'}`, async () => {
    const label = /^조회할 분반/;
    const option = /E2E249-section/;
    let opened = 0;
    let selected = 0;
    let isOpen = false;
    let attempts = 0;
    const page = {
      getByRole: (role, options) => {
        assert.equal(role, 'option');
        assert.deepEqual(options, { name: option, exact: false });
        return {
          isVisible: async () => isOpen,
          click: async () => {
            assert.ok(isOpen);
            if (++attempts === 1 && detached) {
              isOpen = false;
              throw new Error('Element was detached from the DOM');
            }
            selected++;
          },
        };
      },
    };
    const scope = {
      page: () => page,
      getByRole: (role, options) => {
        assert.equal(role, 'combobox');
        assert.deepEqual(options, { name: label, exact: false });
        return {
          click: async () => {
            opened++;
            isOpen = !isOpen;
          },
        };
      },
    };
    await choose(scope, label, option);
    assert.equal(opened, detached ? 2 : 1);
    assert.equal(selected, 1);
  });
}
