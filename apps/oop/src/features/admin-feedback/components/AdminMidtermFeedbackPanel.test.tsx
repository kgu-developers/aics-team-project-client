import type { AdminMidtermFeedbackDto } from '@aics/api-client';
import { AstryxThemeProvider } from '@aics/design-system';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';

import { AdminMidtermFeedbackPanel } from './AdminMidtermFeedbackPanel';

const initialFeedback = {
  history: [
    {
      authorName: '이은정',
      content: '시연 흐름을 보완해 주세요.',
      createdAt: '2026/10/13',
      feedbackId: 'feedback-1',
    },
  ],
  latestStudentResponse: {
    authorName: '김민준',
    content: '시연 흐름을 보완했습니다.',
    createdAt: '2026/10/14',
    responseId: 'response-1',
  },
} satisfies AdminMidtermFeedbackDto;

it('새 피드백 ID를 받은 뒤에는 작성 중인 draft를 최신 피드백으로 동기화한다', async () => {
  const user = userEvent.setup();
  const { rerender } = render(
    <AstryxThemeProvider>
      <AdminMidtermFeedbackPanel feedback={initialFeedback} />
    </AstryxThemeProvider>,
  );
  const feedbackInput = screen.getByRole('textbox', {
    name: '중간 점검 피드백',
  });

  await user.clear(feedbackInput);
  await user.type(feedbackInput, '작성 중인 피드백');

  rerender(
    <AstryxThemeProvider>
      <AdminMidtermFeedbackPanel
        feedback={{
          ...initialFeedback,
          history: [
            {
              authorName: '이은정',
              content: '시연 흐름을 보완해 주세요.',
              createdAt: '2026/10/13',
              feedbackId: 'feedback-2',
            },
          ],
        }}
      />
    </AstryxThemeProvider>,
  );

  expect(feedbackInput).toHaveValue('시연 흐름을 보완해 주세요.');
});

it('제출물 ID가 바뀌면 이전 제출물의 draft를 유지하지 않는다', async () => {
  const user = userEvent.setup();
  const { rerender } = render(
    <AstryxThemeProvider>
      <AdminMidtermFeedbackPanel
        feedback={initialFeedback}
        key='submission-1'
      />
    </AstryxThemeProvider>,
  );
  const feedbackInput = screen.getByRole('textbox', {
    name: '중간 점검 피드백',
  });

  await user.clear(feedbackInput);
  await user.type(feedbackInput, '1팀에만 작성 중인 피드백');

  rerender(
    <AstryxThemeProvider>
      <AdminMidtermFeedbackPanel
        feedback={initialFeedback}
        key='submission-2'
      />
    </AstryxThemeProvider>,
  );

  expect(screen.getByRole('textbox', { name: '중간 점검 피드백' })).toHaveValue(
    '시연 흐름을 보완해 주세요.',
  );
});
