import { AstryxThemeProvider } from '@aics/design-system';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';

import AdminStudentMilestonePreview from './AdminStudentMilestonePreview';

it('중간보고서 학생 화면과 같은 영역 탐색 및 읽기 전용 입력 형태를 보여준다', async () => {
  const user = userEvent.setup();
  render(
    <AstryxThemeProvider>
      <AdminStudentMilestonePreview artifacts={[]} templateId='midterm' />
    </AstryxThemeProvider>,
  );

  expect(
    screen.getByRole('heading', { name: '학생 화면 미리보기' }),
  ).toBeVisible();
  expect(
    screen.getByRole('navigation', { name: '중간보고서 작성 영역' }),
  ).toBeVisible();
  expect(screen.getByLabelText('프로젝트 제목')).toBeDisabled();
  expect(screen.getByRole('button', { name: '저장' })).toBeDisabled();

  await user.click(screen.getByRole('button', { name: '2. 화면 GUI 설계' }));

  expect(screen.getByLabelText('화면 GUI 목록')).toBeDisabled();
  expect(screen.queryByLabelText('프로젝트 제목')).not.toBeInTheDocument();
});

it('제안서는 학생 화면의 팀 정보와 문서 영역을 분리해 보여준다', () => {
  render(
    <AstryxThemeProvider>
      <AdminStudentMilestonePreview artifacts={[]} templateId='proposal' />
    </AstryxThemeProvider>,
  );

  expect(screen.getByText('팀명')).toBeVisible();
  expect(screen.getByText('팀원 목록과 역할 분담')).toBeVisible();
});

it('발표·최종 보고서는 학생 제출 모달 폭의 단일 읽기 전용 양식으로 보여준다', () => {
  render(
    <AstryxThemeProvider>
      <AdminStudentMilestonePreview
        artifacts={[
          {
            allowedExtensions: ['pdf'],
            label: '프레젠테이션 자료',
            maxFileSizeMb: 100,
            required: true,
            type: 'FILE',
          },
          {
            label: '시연 영상',
            required: true,
            type: 'LINK',
          },
        ]}
        templateId='presentation-submit'
      />
    </AstryxThemeProvider>,
  );

  expect(
    screen.getByRole('region', {
      name: '발표 자료 제출 학생 제출 모달 미리보기',
    }),
  ).toBeVisible();
  expect(
    screen.getByRole('heading', { name: '학생 화면 미리보기' }),
  ).toBeVisible();
  expect(screen.getByRole('heading', { name: '발표 자료 제출' })).toBeVisible();
  expect(
    screen.getByText(
      '현재 마일스톤 설정을 기준으로 한 학생 제출 모달의 읽기 전용 예시입니다.',
    ),
  ).toBeVisible();
  expect(screen.getByLabelText(/제출 설명/)).toBeDisabled();
  expect(
    screen.getByText('기본 필수 항목 · 산출물 목록과 별도로 항상 제출합니다.'),
  ).toBeVisible();
  expect(
    screen.getByRole('button', { name: '프레젠테이션 자료' }),
  ).toBeDisabled();
  expect(screen.getByLabelText(/시연 영상/)).toBeDisabled();
  expect(screen.getByText('PDF · 최대 100MB')).toBeVisible();
  expect(screen.getByRole('button', { name: '파일 제출' })).toBeDisabled();
});

it('산출물 설정을 불러오지 못하면 빈 목록으로 오해시키지 않고 재시도를 제공한다', () => {
  const retry = vi.fn();
  render(
    <AstryxThemeProvider>
      <AdminStudentMilestonePreview
        artifacts={[]}
        artifactState='error'
        onRetryArtifacts={retry}
        templateId='final-report'
      />
    </AstryxThemeProvider>,
  );

  expect(
    screen.getByRole('heading', { name: '학생 화면 미리보기' }),
  ).toBeVisible();
  expect(
    screen.getByText('학생 제출 화면 설정을 불러오지 못했습니다.'),
  ).toBeVisible();
  screen.getByRole('button', { name: '다시 시도' }).click();
  expect(retry).toHaveBeenCalledOnce();
});
