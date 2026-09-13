import { test as base, expect } from '@playwright/test';

import { StudentApi } from './api';

export const test = base.extend<{ api: StudentApi }>({
  api: [
    async ({ context, page }, use) => {
      const api = new StudentApi();
      const pageErrors: string[] = [];
      page.on('pageerror', error => pageErrors.push(error.message));
      await api.install(context);
      await use(api);
      expect(
        api.unhandled,
        '미구현 API 응답으로 우연히 통과해서는 안 됩니다.',
      ).toEqual([]);
      expect(pageErrors, '브라우저 JavaScript 오류').toEqual([]);
    },
    { auto: true },
  ],
});
export { expect };
