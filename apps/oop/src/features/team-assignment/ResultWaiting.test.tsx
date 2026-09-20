import { AstryxThemeProvider } from '@aics/design-system';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import ResultWaiting from './ResultWaiting';

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
}));

afterEach(() => {
  vi.useRealTimers();
});

function renderWaiting(resultReleasesAt?: string) {
  return render(
    <AstryxThemeProvider>
      <ResultWaiting resultReleasesAt={resultReleasesAt} />
    </AstryxThemeProvider>,
  );
}

describe('ResultWaiting', () => {
  it('미래 공개 시각에는 미래형 안내를 표시한다', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-20T20:00:00+09:00'));

    renderWaiting('2026-09-20T21:00:00+09:00');

    expect(screen.getByText(/21:00에 공개됩니다/)).toBeVisible();
  });

  it.each([
    ['이미 지난', '2026-09-20T19:00:00+09:00'],
    ['현재와 같은', '2026-09-20T20:00:00+09:00'],
  ])('%s 공개 시각에는 과거형 안내를 표시한다', (_label, releaseAt) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-20T20:00:00+09:00'));

    renderWaiting(releaseAt);

    expect(screen.getByText(/공개 시각.*지났습니다/)).toBeVisible();
    expect(screen.getByText(/배정 결과를 확인하는 중입니다/)).toBeVisible();
    expect(screen.queryByText(/공개됩니다/)).not.toBeInTheDocument();
  });

  it.each([
    ['일정이 없는 경우', undefined],
    ['일정을 해석할 수 없는 경우', 'not-a-date'],
  ])('%s 추후 안내 문구를 표시한다', (_label, releaseAt) => {
    renderWaiting(releaseAt);

    expect(screen.getByText('팀원 공개 일정은 추후 안내됩니다.')).toBeVisible();
    expect(screen.queryByText(/공개됩니다/)).not.toBeInTheDocument();
    expect(screen.queryByText(/지났습니다/)).not.toBeInTheDocument();
  });
});
