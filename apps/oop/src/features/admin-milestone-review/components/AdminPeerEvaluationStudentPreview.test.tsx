import { AstryxThemeProvider } from '@aics/design-system';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import AdminPeerEvaluationStudentPreview from './AdminPeerEvaluationStudentPreview';

describe('AdminPeerEvaluationStudentPreview', () => {
  it('학생 상호평가의 고정 문항을 읽기 전용 학생 화면 형태로 보여준다', () => {
    render(
      <AstryxThemeProvider>
        <AdminPeerEvaluationStudentPreview />
      </AstryxThemeProvider>,
    );

    expect(
      screen.getByRole('heading', {
        name: '학생 상호평가 문항 · 학생 화면 미리보기',
      }),
    ).toBeVisible();
    expect(screen.getByLabelText(/자신의 역할 요약/)).toBeDisabled();
    expect(screen.getByLabelText(/팀 프로젝트 평가/)).toBeDisabled();
    expect(screen.getByLabelText(/소감 또는 팀원 칭찬/)).toBeDisabled();
    expect(screen.getByLabelText(/기여도 \(%\)/)).toBeDisabled();
    expect(screen.getByLabelText(/기여 내용/)).toBeDisabled();
    expect(screen.getByLabelText(/한줄평가/)).toBeDisabled();
    expect(screen.getByText('기여도 합계 0%')).toBeVisible();
  });
});
