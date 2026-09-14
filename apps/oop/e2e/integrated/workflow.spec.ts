import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { env } from 'node:process';
import { stripVTControlCharacters } from 'node:util';

import { test, expect, type BrowserContext, type Page } from '@playwright/test';

import { prepareCourse, importStudents, importTeams } from './admin';
import { createRun, enrollmentFile, teamFile, type Actor } from './data';
import {
  createMilestones,
  openPresentationWindow,
  studentMilestone,
  type MilestoneLinks,
} from './milestones';
import {
  downloadSubmission,
  proposalFeedback,
  midReportFeedback,
  presentationSettings,
  evaluatePresentation,
  submissionDetail,
  submissions,
} from './review';
import {
  createProject,
  submitProposal,
  submitMidReport,
  uploadPdf,
  submitPeerEvaluation,
} from './student';
import { login } from './ui';
import { pdfFile } from '../support/files';

test('관리자 준비 → 학생 작성·제출 → 관리자 검토 통합 플로우', async ({
  browser,
  baseURL,
}, testInfo) => {
  const run = createRun();
  const directory = resolve('../../.agent-local/e2e/integrated/runs', run.key);
  await mkdir(directory, { recursive: true });
  await writeFile(
    resolve(directory, 'dataset.json'),
    JSON.stringify(run, null, 2),
    { mode: 0o600 },
  );
  for (const file of [
    await enrollmentFile(run),
    await teamFile(run),
    pdfFile(),
  ]) {
    await writeFile(resolve(directory, file.name), file.buffer, {
      mode: 0o600,
    });
  }
  await writeFile(
    resolve(directory, 'reset-targets.json'),
    JSON.stringify(
      {
        runKey: run.key,
        purpose:
          '서버 담당자의 수동 초기화 범위 확인용. 자동 삭제 스크립트가 아니다.',
        preserve: ['기존 관리자 계정', '다른 실행 키와 실사용 데이터'],
        scope: {
          courseName: run.course,
          sectionCode: run.section,
          teamNames: [run.team, run.comparison],
          studentNumbers: Object.values(run.users).map(
            user => user.studentNumber,
          ),
        },
        resetBeforeReusingSameAccounts: [
          '평가 응답·평가 항목·양식',
          '제출 버전·파일 연결·팀원 확인·최종 완료 상태',
          '중간 점검 문서·영역 완료·편집 잠금·수정 요청',
          '제안서 완료 상태·피드백·팀 쪽지',
          '프로젝트·주제 후보·투표',
          '팀 배정·팀장 확정·설문 응답',
          '수강 등록·학생 계정·마일스톤·전용 분반·전용 강좌',
        ],
        recreate:
          '해당 실행 키 범위 초기화 후 학생 XLSX → 설문 → 팀 XLSX → 팀 배정 확정 → 마일스톤과 프로젝트 순으로 재생성한다. 새 계정은 업로드 연락처가 초기 비밀번호다. ID와 날짜는 재생성 시점 기준으로 갱신한다.',
        alternative:
          'pnpm test:e2e:integrated 재실행은 새 실행 키와 학번을 생성하므로 기존 데이터 초기화가 필요 없다.',
      },
      null,
      2,
    ),
    { mode: 0o600 },
  );
  const contexts: BrowserContext[] = [];
  const errors: string[] = [];
  const network: { method: string; path: string; status: number }[] = [];
  const outcomes: {
    id: string;
    title: string;
    status: 'passed' | 'failed' | 'skipped';
    reason?: string;
  }[] = [];
  const failures: Error[] = [];
  const dependencies: Record<string, string[]> = {
    '08': ['07'],
    '10': ['09'],
    '12': ['11'],
    '13': ['12'],
    '15': ['14'],
    '16': ['14'],
    '18': ['17'],
  };
  async function capture(id: string) {
    for (const [i, context] of contexts.entries()) {
      for (const page of context.pages()) {
        const name = `${id}-actor-${i}`;
        const screenshot = await page.screenshot({
          fullPage: true,
          mask: [page.locator('pre')],
        });
        await writeFile(resolve(directory, `${name}.png`), screenshot, {
          mode: 0o600,
        });
        await testInfo.attach(name, {
          body: screenshot,
          contentType: 'image/png',
        });
        await writeFile(
          resolve(directory, `${name}.txt`),
          (await page.locator('body').innerText()).replace(
            /https?:\/\/\S+/g,
            '[URL 생략]',
          ),
          { mode: 0o600 },
        );
      }
    }
  }
  async function phase(title: string, action: () => Promise<void>) {
    const id = title.slice(0, 2);
    const blocked = (dependencies[id] ?? []).filter(
      dependency =>
        !outcomes.some(
          result => result.id === dependency && result.status === 'passed',
        ),
    );
    if (blocked.length) {
      outcomes.push({
        id,
        title,
        status: 'skipped',
        reason: `${blocked.join(', ')} 선행 단계 실패`,
      });
      await test.step.skip(title, action);
      return false;
    }
    try {
      await test.step(title, action);
      outcomes.push({ id, title, status: 'passed' });
      return true;
    } catch (error) {
      const failure = error instanceof Error ? error : new Error(String(error));
      outcomes.push({
        id,
        title,
        status: 'failed',
        reason: stripVTControlCharacters(failure.message),
      });
      failures.push(failure);
      await capture(id);
      return false;
    }
  }
  async function setup(title: string, action: () => Promise<void>) {
    if (!(await phase(title, action)))
      throw new Error(`${title}: 공통 준비 실패`);
  }
  async function actor() {
    const context = await browser.newContext({
      baseURL,
      locale: 'ko-KR',
      timezoneId: 'Asia/Seoul',
      serviceWorkers: 'block',
    });
    contexts.push(context);
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => {
      if (['fetch', 'xhr'].includes(response.request().resourceType())) {
        network.push({
          method: response.request().method(),
          path: new URL(response.url()).pathname,
          status: response.status(),
        });
      }
    });
    page.setDefaultTimeout(15_000);
    page.setDefaultNavigationTimeout(30_000);
    return page;
  }
  const admin = await actor();
  const students = new Map<Actor, Page>();
  async function student(role: Actor) {
    let page = students.get(role);
    if (!page) {
      page = await actor();
      await login(page, run.users[role]);
      students.set(role, page);
    }
    return page;
  }
  let milestones: MilestoneLinks;
  let leader: Page;
  try {
    await setup('01 관리자 로그인과 전용 강좌·분반 생성', async () => {
      await login(
        admin,
        {
          studentNumber: env.OOP_E2E_ADMIN_NUMBER!,
          password: env.OOP_E2E_ADMIN_PASSWORD!,
        },
        'admin',
      );
      await prepareCourse(admin, run);
    });
    await setup('02 화면에서 학생 Excel 검증·계정 생성·수강 등록', async () => {
      await importStudents(admin, run);
    });
    await setup('03 학생 사전 설문 제출', async () => {
      const student = await actor();
      await login(student, run.users.survey);
      await student
        .getByRole('button', { name: '시작하기', exact: true })
        .click();
      await student
        .getByRole('checkbox', { name: '개발', exact: true })
        .check();
      await student
        .getByRole('button', { name: '다음 설문', exact: true })
        .click();
      await student
        .getByRole('textbox', { name: /프로젝트 주제 아이디어/ })
        .fill(run.title);
      await student
        .getByRole('button', { name: '설문 제출', exact: true })
        .click();
      await student
        .getByRole('dialog', { name: '설문 제출 확인' })
        .getByRole('button', { name: '제출', exact: true })
        .click();
      await expect(
        student.getByRole('heading', {
          name: '설문에 응답해 주셔서 감사합니다.',
        }),
      ).toBeVisible();
    });
    await setup('04 관리자 팀 명단 반영과 배정 확정', async () => {
      await importTeams(admin, run);
    });
    await setup(
      '05 관리자 제출 마일스톤 4종 공개와 제출 규칙 설정',
      async () => {
        milestones = await createMilestones(admin, run, [
          '제안서',
          '중간 점검',
          '발표',
          '최종 보고서',
        ]);
        await writeFile(
          resolve(directory, 'milestones.json'),
          JSON.stringify(milestones, null, 2),
        );
      },
    );
    await setup('06 팀장 로그인과 주제 후보·프로젝트 확정', async () => {
      leader = await student('leader');
      await createProject(leader, run.title, [
        await student('memberA'),
        await student('memberB'),
        await student('memberC'),
      ]);
    });
    await phase('07 제안서 전체 영역 작성·이미지 업로드·제출', async () => {
      await submitProposal(leader, run, milestones['제안서']);
    });
    await phase('08 관리자 제안서 조회·피드백과 학생 답변', async () => {
      const feedback = await proposalFeedback(admin, run);
      await leader.goto('/student');
      await expect(leader.getByText(feedback, { exact: true })).toBeVisible();
      await leader
        .getByRole('textbox', { name: /^피드백 반영 답변/ })
        .fill(`예외 처리 계획을 추가했습니다. ${run.key}`);
      await leader
        .getByRole('button', { name: '답변 보내기', exact: true })
        .click();
      await expect(
        leader.getByText('피드백 반영 답변을 제출했어요.', { exact: true }),
      ).toBeVisible();
      await submissionDetail(admin, run, '제안서');
      await expect(
        admin.getByText(`예외 처리 계획을 추가했습니다. ${run.key}`, {
          exact: true,
        }),
      ).toBeVisible();
    });
    await phase('09 중간 점검 작성·자동 저장·제출', async () => {
      await submitMidReport(leader, milestones['중간 점검']);
    });
    await phase('10 관리자 수정 요청과 학생 수정본 재제출', async () => {
      await midReportFeedback(admin, run);
      await submitMidReport(leader, milestones['중간 점검'], true);
      await submissionDetail(admin, run, '중간 점검');
      await expect(
        admin.getByText(/상태: SUBMITTED · 현재 버전:/),
      ).toBeVisible();
      await expect(admin.getByText(/수정본 topic 1/)).toBeVisible();
    });
    await phase('11 두 팀의 발표 자료 제출·새 버전 업로드', async () => {
      await uploadPdf(leader, milestones['발표']);
      await uploadPdf(leader, milestones['발표'], false, 2);
      const comparison = await student('comparisonLeader');
      await createProject(comparison, `${run.title} 비교`, [
        await student('comparisonMember'),
      ]);
      await uploadPdf(comparison, milestones['발표']);
    });
    await phase(
      '12 관리자 발표 버전 조회·순서·평가 항목·기간 설정',
      async () => {
        await downloadSubmission(admin, run, '발표 자료 제출', 2);
        await openPresentationWindow(admin, run, milestones['발표']);
        await presentationSettings(admin, run);
      },
    );
    await phase('13 다른 팀 발표 평가와 관리자 결과 조회', async () => {
      await evaluatePresentation(leader, run);
      await submissions(admin, run, '발표 평가');
      const row = admin.getByRole('row').filter({
        has: admin.getByRole('link', { name: run.comparison, exact: true }),
      });
      await expect(
        row.getByRole('cell', { name: '5', exact: true }).first(),
      ).toBeVisible();
    });
    await phase('14 최종보고서 PDF 제출', async () => {
      await uploadPdf(leader, milestones['최종 보고서'], true);
    });
    await phase('15 팀원 3명 승인과 팀장 최종 완료', async () => {
      for (const role of ['memberA', 'memberB', 'memberC'] as const) {
        const member = await student(role);
        await member.goto('/student');
        const card = studentMilestone(member, milestones['최종 보고서']);
        await card
          .getByRole('button', { name: '승인하기', exact: true })
          .click();
        await expect(
          card.getByRole('button', { name: '승인 취소', exact: true }),
        ).toBeEnabled();
      }
      await leader.goto('/student');
      const card = studentMilestone(leader, milestones['최종 보고서']);
      await card
        .getByRole('button', { name: '최종 완료', exact: true })
        .click();
      await expect(
        card.getByRole('button', { name: '완료', exact: true }),
      ).toBeDisabled();
      await leader.reload();
      await expect(
        card.getByRole('button', { name: '완료', exact: true }),
      ).toBeDisabled();
    });
    await phase('16 관리자 최종보고서 파일 조회', async () => {
      await downloadSubmission(admin, run, '최종 보고서', 1);
    });
    await phase('17 관리자 상호평가 개설', async () => {
      Object.assign(
        milestones,
        await createMilestones(admin, run, ['상호 평가']),
      );
      await writeFile(
        resolve(directory, 'milestones.json'),
        JSON.stringify(milestones, null, 2),
      );
    });
    await phase('18 학생 상호평가 제출과 관리자 결과 조회', async () => {
      await submitPeerEvaluation(leader);
      await submissions(admin, run, '상호 평가');
      await admin.getByRole('link', { name: run.team, exact: true }).click();
      await expect(
        admin.getByText(run.users.leader.name, { exact: true }).first(),
      ).toBeVisible();
      await admin
        .getByRole('button', {
          name: `${run.users.leader.name} (팀장)`,
          exact: true,
        })
        .click();
      await expect(
        admin.getByText('통합 테스트와 구현 검토', { exact: true }),
      ).toBeVisible();
    });
    expect(errors, '브라우저 JavaScript 오류').toEqual([]);
    if (failures.length)
      throw new AggregateError(
        failures,
        `${failures.length}개 통합 단계 실패. outcomes.json과 단계별 화면을 확인하세요.`,
      );
  } finally {
    await writeFile(
      resolve(directory, 'network.json'),
      JSON.stringify(network, null, 2),
    );
    await writeFile(
      resolve(directory, 'outcomes.json'),
      JSON.stringify(outcomes, null, 2),
      { mode: 0o600 },
    );
    await writeFile(
      resolve(directory, 'browser-errors.json'),
      JSON.stringify(errors, null, 2),
    );
    await Promise.all(contexts.map(context => context.close()));
  }
});
