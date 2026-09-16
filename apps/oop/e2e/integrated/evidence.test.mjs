import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { test } from 'node:test';

import { captureFailurePage } from './evidence.ts';

for (const path of [
  '/admin',
  '/admin/student-team',
  '/admin/meetings/1',
  '/admin/notices/1',
  '/student',
  '/onboarding',
  '/login',
]) {
  test(`failed ${path} captures a masked screenshot and scoped, redacted dialog evidence`, async () => {
    const writes = [];
    let screenshotOptions;
    let dialogScreenshotOptions;
    const dialog = {
      filter: options => {
        assert.deepEqual(options, { hasText: 'run.key' });
        return dialog;
      },
      count: async () => 1,
      isVisible: async () => true,
      screenshot: async options => {
        dialogScreenshotOptions = options;
        return Buffer.from('dialog image');
      },
      innerText: async () => 'run.key private credential',
    };
    const page = {
      url: () => `https://example.test${path}`,
      locator: selector => ({ selector }),
      getByRole: (role, options) => {
        if (role === 'dialog') return dialog;
        if (role === 'row') return { filter: filter => ({ role, ...filter }) };
        return { role, ...options };
      },
      screenshot: async options => {
        screenshotOptions = options;
        return Buffer.from('masked image');
      },
    };
    await captureFailurePage({
      page,
      runKey: 'run.key',
      name: '02-admin',
      write: async (name, data) => {
        writes.push([name, data]);
      },
      describeError: text => text.replace('private credential', '[redacted]'),
    });
    assert.deepEqual(screenshotOptions, {
      fullPage: true,
      timeout: 5_000,
      mask: [
        { selector: 'pre, input[type="password"]' },
        { role: 'textbox', name: /^학번/ },
        ...(path.startsWith('/admin')
          ? [{ role: 'row', hasNotText: 'run.key' }]
          : []),
      ],
    });
    assert.deepEqual(dialogScreenshotOptions, {
      timeout: 5_000,
      mask: screenshotOptions.mask,
    });
    assert.deepEqual(
      writes.map(([name]) => name),
      ['02-admin-failure.png', '02-admin-dialog.png', '02-admin-dialog.txt'],
    );
    assert.equal(writes[2][1], 'run.key [redacted]');
  });
}
