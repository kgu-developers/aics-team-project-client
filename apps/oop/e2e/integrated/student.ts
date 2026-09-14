import { Buffer } from 'node:buffer';

import { expect, type Page } from '@playwright/test';

import type { Run } from './data';
import { studentMilestone } from './milestones';
import { pdfFile } from '../support/files';

const png = {
  name: 'library.png',
  mimeType: 'image/png',
  buffer: Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=',
    'base64',
  ),
};

async function addCandidate(page: Page, title: string) {
  await page.goto('/student');
  await page.getByRole('button', { name: '후보 추가', exact: true }).click();
  const candidate = page.getByRole('dialog', {
    name: '주제 후보 추가',
    exact: true,
  });
  await candidate
    .getByRole('textbox', { name: '후보 제목', exact: true })
    .fill(title);
  await candidate
    .getByRole('textbox', { name: '후보 설명', exact: true })
    .fill('도서 검색과 대출을 관리하는 프로그램');
  await candidate
    .getByRole('button', { name: '후보 추가', exact: true })
    .click();
  await expect(candidate).toBeHidden();
}

export async function createProject(
  page: Page,
  title: string,
  members: Page[],
) {
  expect(
    members.length,
    '본인 후보에는 투표할 수 없어 두 명 이상이 필요하다',
  ).toBeGreaterThan(0);
  await addCandidate(page, title);
  await addCandidate(members[0]!, `${title} 대안`);
  for (const voter of [page, ...members]) {
    await voter.goto('/student');
    const choice = voter === page ? `${title} 대안` : title;
    const radio = voter.getByRole('radio', { name: choice, exact: true });
    await radio.click();
    await expect(radio).toBeChecked();
    await expect(
      voter.getByText('내 투표 완료', { exact: true }),
    ).toBeVisible();
    await voter.reload();
    await expect(radio).toBeChecked();
  }
  await page.goto('/student');
  await expect(
    page.getByText(`투표 참여 ${members.length + 1}/${members.length + 1}명`, {
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole('button', { name: '주제 확정', exact: true }).click();
  const finalize = page.getByRole('dialog', {
    name: '팀 주제 확정',
    exact: true,
  });
  await finalize.getByRole('radio', { name: title, exact: true }).check();
  await finalize
    .getByRole('textbox', { name: '프로젝트 목표', exact: true })
    .fill('객체 지향 설계로 도서 대출 흐름을 구현한다.');
  await finalize
    .getByRole('button', { name: '이 주제로 확정', exact: true })
    .click();
  await expect(finalize).toBeHidden();
}

async function addScreen(page: Page, midReport = false) {
  await page
    .getByRole('button', { name: '화면 이미지 추가', exact: true })
    .click();
  const dialog = page.getByRole('dialog', { name: '화면 추가', exact: true });
  await dialog.locator('input[type="file"]').setInputFiles(png);
  await dialog
    .getByRole('textbox', { name: midReport ? '이름' : '제목', exact: true })
    .fill('도서 검색 화면');
  await dialog
    .getByRole('textbox', { name: '설명', exact: true })
    .fill('제목과 저자로 도서를 검색한다.');
  await dialog.getByRole('button', { name: '추가', exact: true }).click();
  await expect(dialog).toBeHidden();
}

export async function submitProposal(page: Page, run: Run, href: string) {
  for (const section of [
    'topic',
    'data-composition',
    'screen-composition',
    'team-operations',
  ]) {
    await page.goto(`/student/editor/proposal/${section}`);
    if (section === 'topic') {
      await page
        .getByRole('textbox', { name: /^프로젝트 제목/ })
        .fill(run.title);
      await page
        .getByRole('textbox', { name: /^프로젝트 설명/ })
        .fill('도서 검색, 대출, 반납 기능을 개발한다.');
      await page
        .getByRole('textbox', { name: /^프로젝트 목표/ })
        .fill('대출 규칙을 객체로 분리하고 테스트한다.');
    } else if (section === 'data-composition') {
      await page
        .getByRole('textbox', { name: '데이터 1 이름', exact: true })
        .fill('도서');
      await page
        .getByRole('textbox', { name: '데이터 1 설명', exact: true })
        .fill('ISBN, 제목, 저자, 대출 상태');
      await page
        .getByRole('textbox', { name: '데이터 1 예상 개수', exact: true })
        .fill('100');
    } else if (section === 'screen-composition') {
      await addScreen(page);
    } else {
      await page
        .getByRole('textbox', { name: '팀 규칙', exact: true })
        .fill('변경 내용을 함께 검토한다.');
      await page
        .getByRole('textbox', { name: '회의 시간·빈도·방식', exact: true })
        .fill('매주 월요일 온라인 회의');
      await page
        .getByRole('textbox', { name: '진행 일정', exact: true })
        .fill('설계 → 구현 → 검증');
      for (const role of ['leader', 'memberA', 'memberB', 'memberC'] as const) {
        await page
          .getByRole('textbox', {
            name: `${run.users[role].name} 역할`,
            exact: true,
          })
          .fill(`${role} 기능 개발 및 검증`);
      }
    }
    await page.getByRole('button', { name: '저장', exact: true }).click();
    await page.getByRole('button', { name: '작성 완료', exact: true }).click();
    await expect(
      page.getByText('영역을 작성 완료했어요.', { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: '작성 완료', exact: true }),
    ).toBeDisabled();
  }
  await page.goto('/student');
  await studentMilestone(page, href)
    .getByRole('button', { name: '제출하기', exact: true })
    .click();
  await expect(
    page.getByText('제안서를 제출했어요.', { exact: true }),
  ).toBeVisible();
  await page.goto('/student/editor/proposal/topic');
  await expect(
    page.getByRole('textbox', { name: /^프로젝트 제목/ }),
  ).toBeDisabled();
}

export async function submitMidReport(
  page: Page,
  href: string,
  revision = false,
) {
  for (const section of [
    'topic',
    'gui-design',
    'engine-design',
    'project-plan',
  ]) {
    await page.goto(`/student/editor/mid-review/${section}`);
    if (section === 'gui-design') {
      if (!revision) await addScreen(page, true);
      else {
        await page
          .getByRole('button', { name: '편집', exact: true })
          .first()
          .click();
        const dialog = page.getByRole('dialog', {
          name: '화면 편집',
          exact: true,
        });
        await dialog
          .getByRole('textbox', { name: '설명', exact: true })
          .fill('피드백 반영: 검색 결과에 대출 상태를 표시한다.');
        await dialog.getByRole('button', { name: '적용', exact: true }).click();
      }
    } else {
      if (section === 'engine-design' && !revision) {
        await page
          .getByRole('button', { name: '테스트 케이스 추가', exact: true })
          .click();
      }
      const fields = page.getByRole('textbox');
      await expect(fields.first()).toBeEditable();
      for (let i = 0; i < (await fields.count()); i++) {
        await fields
          .nth(i)
          .fill(
            `${revision ? '수정본' : '초안'} ${section} ${i + 1}: 도서 관리 기능 구현과 테스트 결과`,
          );
      }
    }
    await page.getByRole('button', { name: '작성 완료', exact: true }).click();
    await expect(
      page.getByRole('button', { name: '작성 완료됨', exact: true }),
    ).toBeVisible();
  }
  await page.goto('/student');
  await studentMilestone(page, href)
    .getByRole('button', { name: /^(제출하기|재제출)$/ })
    .click();
  await expect(
    page.getByText('중간보고서를 제출했어요.', { exact: true }),
  ).toBeVisible();
  await page.goto('/student/editor/mid-review/topic');
  await expect(page.getByRole('textbox').first()).toBeDisabled();
}

export async function uploadPdf(
  page: Page,
  href: string,
  finalReport = false,
  version = 1,
) {
  await page.goto('/student');
  const card = studentMilestone(page, href);
  await card
    .getByRole('button', {
      name: /^(파일 제출|파일 교체|재제출|파일 재제출|제출하기)$/,
    })
    .click();
  const dialog = page.getByRole('dialog', {
    name: finalReport ? '최종 파일 제출' : '발표 자료 제출',
    exact: true,
  });
  await dialog
    .getByRole('textbox', { name: /^제출 설명/ })
    .fill(`통합 검증 ${version}차 PDF`);
  if (version > 1)
    await dialog
      .getByRole('textbox', { name: /^변경 사항/ })
      .fill('관리자 검토 후 새 버전 제출');
  await dialog.locator('input[type="file"]').setInputFiles(pdfFile());
  await dialog
    .getByRole('button', { name: /^(파일 제출|파일 재제출)$/ })
    .click();
  await expect(dialog.getByText(/파일 제출을 저장했어요/)).toBeVisible();
  await page.keyboard.press('Escape');
  await page.reload();
  await expect(
    card.getByText('제출 완료', { exact: true }).first(),
  ).toBeVisible();
}

export async function submitPeerEvaluation(page: Page) {
  await page.goto('/student/peer-review');
  await page
    .getByRole('textbox', { name: /^자신의 역할 요약/ })
    .fill('통합 테스트와 구현 검토');
  await page
    .getByRole('textbox', { name: /^팀 프로젝트 평가/ })
    .fill('학생과 관리자 흐름을 검증했습니다.');
  await page
    .getByRole('textbox', { name: /^소감 또는 팀원 칭찬/ })
    .fill('모든 팀원이 역할을 수행했습니다.');
  await page.getByRole('button', { name: '다음 설문', exact: true }).click();
  const rows = page
    .getByRole('row')
    .filter({ has: page.getByRole('button', { name: /^(평가|수정)$/ }) });
  await expect(rows).toHaveCount(3);
  for (let i = 0; i < 3; i++) {
    await rows
      .nth(i)
      .getByRole('button', { name: /^(평가|수정)$/ })
      .click();
    const dialog = page.getByRole('dialog', { name: /기여도 평가/ });
    await dialog
      .getByRole('textbox', { name: /^기여도/ })
      .fill(String(i === 0 ? 34 : 33));
    await dialog
      .getByRole('textbox', { name: /^기여 내용/ })
      .fill('설계와 구현 검증');
    await dialog
      .getByRole('textbox', { name: /^한줄평가/ })
      .fill('협업에 적극적으로 참여했습니다.');
    await dialog
      .getByRole('button', { name: '평가 저장', exact: true })
      .click();
    await expect(dialog).toBeHidden();
  }
  await expect(page.getByText('합계 충족', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '제출하기', exact: true }).click();
  await expect(page.getByText(/제출.*완료|제출했/).first()).toBeVisible();
  await page.goto('/student/peer-review');
  await expect(
    page.getByRole('textbox', { name: /^자신의 역할 요약/ }),
  ).toBeDisabled();
}
