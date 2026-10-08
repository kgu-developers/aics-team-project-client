import { AstryxThemeProvider } from '@aics/design-system';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { PresentationTeamNavigator } from './PresentationTeamNavigator';

describe('PresentationTeamNavigator', () => {
  it('현재 발표 팀과 순번을 보여주고 이전·다음 팀 이동을 전달한다', async () => {
    const user = userEvent.setup();
    const onPrevious = vi.fn();
    const onNext = vi.fn();

    render(
      <AstryxThemeProvider>
        <PresentationTeamNavigator
          currentIndex={1}
          isNextDisabled={false}
          isPreviousDisabled={false}
          onNext={onNext}
          onPrevious={onPrevious}
          presentationLabel='2번 발표'
          teamLabel='브라보'
          total={3}
        />
      </AstryxThemeProvider>,
    );

    expect(
      screen.getByRole('navigation', { name: '발표 팀 이동' }),
    ).toHaveTextContent('2번 발표 · 브라보 · 2 / 3');

    await user.click(screen.getByRole('button', { name: '이전 팀' }));
    await user.click(screen.getByRole('button', { name: '다음 팀' }));

    expect(onPrevious).toHaveBeenCalledOnce();
    expect(onNext).toHaveBeenCalledOnce();
  });

  it('처음·마지막 팀에서는 해당 방향 이동을 막는다', () => {
    render(
      <AstryxThemeProvider>
        <PresentationTeamNavigator
          currentIndex={0}
          isNextDisabled
          isPreviousDisabled
          onNext={vi.fn()}
          onPrevious={vi.fn()}
          presentationLabel='1번 발표'
          teamLabel='알파'
          total={1}
        />
      </AstryxThemeProvider>,
    );

    expect(screen.getByRole('button', { name: '이전 팀' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '다음 팀' })).toBeDisabled();
  });
});
