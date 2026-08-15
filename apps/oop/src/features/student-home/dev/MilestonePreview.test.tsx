import { AstryxThemeProvider } from '@aics/design-system';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import MilestonePreview from './MilestonePreview';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    addEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    matches: false,
    media: '',
    onchange: null,
    removeEventListener: vi.fn(),
  })),
});

afterEach(() => {
  window.history.replaceState(null, '', '/student');
});

describe('MilestonePreview', () => {
  it('페이지를 새로고침하지 않고 URL을 바꾼 뒤 데이터를 다시 요청한다', () => {
    const onPreviewChange = vi.fn();

    render(
      <AstryxThemeProvider>
        <MilestonePreview onPreviewChange={onPreviewChange} />
      </AstryxThemeProvider>,
    );

    fireEvent.click(
      screen.getByRole('button', { name: '발표 · 평가' }),
    );

    expect(window.location.search).toBe(
      '?milestonePreview=presentation-evaluation',
    );
    expect(onPreviewChange).toHaveBeenCalledOnce();
  });

  it('제안서 피드백과 중간 단계 진행이 함께 열린 preview 상태를 URL로 선택한다', () => {
    const onPreviewChange = vi.fn();

    render(
      <AstryxThemeProvider>
        <MilestonePreview onPreviewChange={onPreviewChange} />
      </AstryxThemeProvider>,
    );

    fireEvent.click(
      screen.getByRole('button', { name: '제안서 피드백 · 중간 작성' }),
    );

    expect(window.location.search).toBe(
      '?milestonePreview=proposal-feedback-mid-report',
    );
    expect(onPreviewChange).toHaveBeenCalledOnce();
  });
});
