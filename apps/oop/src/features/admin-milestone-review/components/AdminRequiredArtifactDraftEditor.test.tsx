import { AstryxThemeProvider } from '@aics/design-system';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { expect, it, vi } from 'vitest';

import type { AdminRequiredArtifactDraft } from '../model';
import AdminRequiredArtifactDraftEditor from './AdminRequiredArtifactDraftEditor';

it('산출물 초안 추가는 마일스톤 폼을 제출하거나 입력값을 초기화하지 않는다', async () => {
  const submitMilestone = vi.fn(event => event.preventDefault());
  function Form() {
    const [drafts, setDrafts] = useState<AdminRequiredArtifactDraft[]>([]);
    return (
      <form aria-label='마일스톤 등록' onSubmit={submitMilestone}>
        <input aria-label='제목' defaultValue='발표' />
        <AdminRequiredArtifactDraftEditor value={drafts} onChange={setDrafts} />
      </form>
    );
  }
  render(
    <AstryxThemeProvider>
      <Form />
    </AstryxThemeProvider>,
  );
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: '산출물 추가' }));
  const dialog = screen.getByRole('dialog', { name: '산출물 초안 추가' });
  expect(dialog.closest('form')).toBeNull();
  await user.type(
    within(dialog).getByRole('textbox', { name: /산출물 이름/ }),
    '프로젝트 설명',
  );
  await user.click(within(dialog).getByRole('button', { name: '추가' }));
  expect(submitMilestone).not.toHaveBeenCalled();
  expect(screen.getByRole('textbox', { name: '제목' })).toHaveValue('발표');
  expect(screen.getByText('프로젝트 설명', { exact: true })).toBeVisible();
  expect(
    screen.queryByRole('dialog', { name: '산출물 초안 추가' }),
  ).not.toBeInTheDocument();
});
