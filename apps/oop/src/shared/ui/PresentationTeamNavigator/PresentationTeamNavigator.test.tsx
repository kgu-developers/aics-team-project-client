import { AstryxThemeProvider } from '@aics/design-system';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { PresentationTeamNavigator } from './PresentationTeamNavigator';
import * as styles from './PresentationTeamNavigator.css';

describe('PresentationTeamNavigator', () => {
  it('직접 이동을 사용할 수 없으면 좁은 화면에서도 팀 요약을 숨기지 않는다', () => {
    render(
      <AstryxThemeProvider>
        <PresentationTeamNavigator
          currentIndex={0}
          isNextDisabled={false}
          isPreviousDisabled
          onNext={vi.fn()}
          onPrevious={vi.fn()}
          presentationLabel='1번 발표'
          teamLabel='알파'
          total={2}
          teams={[{ label: '알파', statusLabel: '우리 팀', value: '7' }]}
        />
      </AstryxThemeProvider>,
    );
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.getByText('1번 발표 · 알파 · 1 / 2')).not.toHaveClass(
      styles.desktopStatus,
    );
  });
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
          teams={[
            { label: '알파', statusLabel: '우리 팀 · 평가 제외', value: '7' },
            { label: '브라보', statusLabel: '평가 완료', value: '8' },
            { label: '찰리', statusLabel: '평가 전', value: '9' },
          ]}
          selectedTeamValue='8'
          onSelectTeam={vi.fn()}
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

  it('모바일 선택기로 팀을 직접 이동하고 상태를 텍스트로 함께 보여준다', async () => {
    const user = userEvent.setup();
    const onSelectTeam = vi.fn();
    render(
      <AstryxThemeProvider>
        <PresentationTeamNavigator
          currentIndex={0}
          isNextDisabled={false}
          isPreviousDisabled
          onNext={vi.fn()}
          onPrevious={vi.fn()}
          onSelectTeam={onSelectTeam}
          presentationLabel='1번 발표'
          selectedTeamValue='7'
          teamLabel='알파'
          teams={[
            {
              label: '1번 · 알파',
              statusLabel: '우리 팀 · 평가 제외',
              value: '7',
            },
            { label: '2번 · 브라보', statusLabel: '평가 완료', value: '8' },
          ]}
          total={2}
        />
      </AstryxThemeProvider>,
    );

    await user.click(
      screen.getByRole('combobox', { name: '발표 팀 바로 이동' }),
    );
    const list = within(screen.getByRole('listbox'));
    expect(list.getByText('우리 팀 · 평가 제외')).toBeInTheDocument();
    expect(list.getByText('평가 완료')).toBeInTheDocument();
    await user.click(list.getByText('2번 · 브라보'));
    expect(onSelectTeam).toHaveBeenCalledWith('8');
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
