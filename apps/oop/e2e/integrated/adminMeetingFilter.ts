import type { Page } from '@playwright/test';

export function adminMeetingFilter(page: Page) {
  return page.getByRole('group', { name: '분반 필터', exact: true });
}

export function adminMeetingRow(page: Page, title: string) {
  return page.getByRole('row', {
    name: `${title} 회의록 보기`,
    exact: true,
  });
}
