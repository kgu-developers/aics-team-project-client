import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { env } from 'node:process';
import { stripVTControlCharacters } from 'node:util';

import { test, expect, type BrowserContext, type Page } from '@playwright/test';

import { prepareCourse, importStudents, importTeams } from './admin';
import { createRun, enrollmentFile, teamFile, type Actor } from './data';
import {
  consoleResourcePath,
  unexpectedConsoleErrors,
  unversionedApiRequests,
  type ConsoleEvidence,
  type RequestEvidence,
  type ResponseEvidence,
} from './diagnostics';
import { captureFailurePage, maskedScreenshot } from './evidence';
import {
  createMeeting,
  addMeetingAction,
  memberMeeting,
  adminReadMeeting,
  deniedMeeting,
  cancelDeleteMeeting,
  teamActionPlan,
  readAction,
  editMeeting,
  deleteMeeting,
  studentMeetingDeleted,
  adminMeetingDeleted,
} from './meetings';
import {
  createMilestones,
  openPresentationWindow,
  studentMilestone,
  type MilestoneLinks,
} from './milestones';
import {
  createNotice,
  readNotice,
  studentReadsNotice,
  editNotice,
  studentUpdatedNotice,
} from './notices';
import { createResources } from './resources';
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
  currentProposalDetailPath,
  presentationEvaluationRowName,
} from './reviewRoute';
import { createStageRunner } from './stages';
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
}) => {
  const run = createRun();
  const directory = resolve('../../.agent-local/e2e/integrated/runs', run.key);
  await mkdir(directory, { recursive: true });
  const json = (name: string, data: unknown) =>
    writeFile(resolve(directory, name), JSON.stringify(data, null, 2), {
      mode: 0o600,
    });
  await json('dataset.json', run);
  for (const file of [
    await enrollmentFile(run),
    await teamFile(run),
    pdfFile(),
  ]) {
    await writeFile(resolve(directory, file.name), file.buffer, {
      mode: 0o600,
    });
  }
  const resources = createResources(run);
  const saveResources = () => json('reset-targets.json', resources);
  await saveResources();
  const contexts: BrowserContext[] = [];
  const pages = new Map<string, Page>();
  const errors: { stage: string; actor: string; message: string }[] = [];
  const requests: RequestEvidence[] = [];
  const network: ResponseEvidence[] = [];
  const consoleErrors: ConsoleEvidence[] = [];
  const loginRecoveries: { stage: string; actor: string }[] = [];
  let currentStage = 'initialization';
  const safeError = (error: unknown) =>
    stripVTControlCharacters(
      error instanceof Error ? error.message : String(error),
    )
      .replace(/https?:\/\/\S+/g, '[URL omitted]')
      .replaceAll(env.OOP_E2E_ADMIN_PASSWORD!, '[credential omitted]')
      .replaceAll(env.OOP_E2E_ADMIN_NUMBER!, '[admin omitted]');
  async function screenshot(page: Page, name: string) {
    const image = await maskedScreenshot(page, run.key);
    await writeFile(resolve(directory, `${name}.png`), image, { mode: 0o600 });
  }
  async function capture(id: string) {
    const results = await Promise.allSettled(
      [...pages].map(async ([actor, page]) => {
        const path = new URL(page.url()).pathname;
        await json(`${id}-${actor}-route.json`, { stage: id, actor, path });
        await captureFailurePage({
          page,
          runKey: run.key,
          name: `${id}-${actor}`,
          write: async (name, data) => {
            await writeFile(resolve(directory, name), data, { mode: 0o600 });
          },
          describeError: safeError,
        });
      }),
    );
    const rejected = results.find(result => result.status === 'rejected');
    if (rejected?.status === 'rejected') throw rejected.reason;
  }
  const runner = createStageRunner({
    execute: async (id, title, action) => {
      currentStage = id;
      await test.step(
        `${id} ${title}`,
        async () => {
          if (
            [
              '02',
              '04',
              '05',
              '08',
              '10',
              '12',
              '13',
              '16',
              '17',
              '18',
              'M04',
              'M09',
              'M12',
              'N01',
              'N03',
            ].includes(id) &&
            new URL(admin.url()).pathname === '/login'
          ) {
            loginRecoveries.push({ stage: id, actor: 'admin' });
            await loginAdmin();
          }
          await action();
        },
        {
          timeout: id.startsWith('M') || id.startsWith('N') ? 90_000 : 180_000,
        },
      );
    },
    capture,
    persist: async outcomes => {
      resources.blockers = outcomes
        .filter(outcome => outcome.status !== 'passed')
        .map(outcome => ({
          stageId: outcome.id,
          reason: outcome.reason ?? outcome.status,
        }));
      await Promise.all([
        json('outcomes.json', outcomes),
        json('network.json', network),
        json('requests.json', requests),
        json('browser-errors.json', errors),
        json('console-errors.json', consoleErrors),
        json('login-recoveries.json', loginRecoveries),
        saveResources(),
      ]);
    },
    describeError: safeError,
  });
  const phase = runner.phase;
  async function evidence(page: Page, name: string) {
    try {
      await screenshot(page, name);
    } catch (error) {
      runner.evidenceErrors.push(safeError(error));
    }
  }
  async function actor(name: string) {
    const context = await browser.newContext({
      baseURL,
      locale: 'ko-KR',
      timezoneId: 'Asia/Seoul',
      serviceWorkers: 'block',
    });
    contexts.push(context);
    const page = await context.newPage();
    pages.set(name, page);
    page.on('pageerror', error =>
      errors.push({
        stage: currentStage,
        actor: name,
        message: safeError(error),
      }),
    );
    page.on('console', message => {
      if (message.type() === 'error')
        consoleErrors.push({
          stage: currentStage,
          actor: name,
          message: safeError(message.text()),
          path: consoleResourcePath(message.location().url),
        });
    });
    page.on('request', request => {
      requests.push({
        stage: currentStage,
        actor: name,
        method: request.method(),
        path: new URL(request.url()).pathname,
      });
    });
    page.on('response', response => {
      if (['fetch', 'xhr'].includes(response.request().resourceType()))
        network.push({
          stage: currentStage,
          actor: name,
          method: response.request().method(),
          path: new URL(response.url()).pathname,
          status: response.status(),
        });
    });
    page.setDefaultTimeout(15_000);
    page.setDefaultNavigationTimeout(30_000);
    return page;
  }
  const admin = await actor('admin');
  async function loginAdmin() {
    await login(
      admin,
      {
        studentNumber: env.OOP_E2E_ADMIN_NUMBER!,
        password: env.OOP_E2E_ADMIN_PASSWORD!,
      },
      'admin',
    );
  }
  const students = new Map<Actor, Page>();
  const loggedIn = new Set<Actor>();
  async function student(role: Actor) {
    let page = students.get(role);
    if (!page) {
      page = await actor(role);
      students.set(role, page);
    }
    if (!loggedIn.has(role) || new URL(page.url()).pathname === '/login') {
      if (loggedIn.has(role))
        loginRecoveries.push({ stage: currentStage, actor: role });
      await login(page, run.users[role]);
      loggedIn.add(role);
    }
    return page;
  }
  let milestones: Partial<MilestoneLinks> = {};
  const milestone = (name: keyof MilestoneLinks) => {
    const path = milestones[name];
    if (!path) throw new Error(`${name}: UI milestone link was not captured`);
    return path;
  };
  const ownedMeeting = () => {
    if (!resources.meeting.studentDetailPath)
      throw new Error('Owned meeting UI path is missing');
    return resources.meeting.studentDetailPath;
  };
  const ownedNotice = () => {
    if (!resources.notice.adminPath)
      throw new Error('Owned notice UI path is missing');
    return resources.notice.adminPath;
  };
  try {
    await phase('01', '관리자 로그인과 전용 강좌·분반 생성', async () => {
      await loginAdmin();
      await prepareCourse(admin, run);
    });
    await phase(
      '02',
      '화면에서 학생 Excel 검증·계정 생성·수강 등록',
      async () => {
        await importStudents(admin, run);
      },
    );
    await phase('03', '학생 사전 설문 제출', async () => {
      const page = await student('survey');
      await page.getByRole('button', { name: '시작하기', exact: true }).click();
      await page.getByRole('checkbox', { name: '개발', exact: true }).check();
      await page
        .getByRole('button', { name: '다음 설문', exact: true })
        .click();
      await page
        .getByRole('textbox', { name: /프로젝트 주제 아이디어/ })
        .fill(run.title);
      await page
        .getByRole('button', { name: '설문 제출', exact: true })
        .click();
      await page
        .getByRole('dialog', { name: '설문 제출 확인' })
        .getByRole('button', { name: '제출', exact: true })
        .click();
      await expect(
        page.getByRole('heading', {
          name: '설문에 응답해 주셔서 감사합니다.',
        }),
      ).toBeVisible();
    });
    await phase('04', '관리자 팀 명단 반영과 배정 확정', async () => {
      await importTeams(admin, run);
    });
    await phase(
      '05',
      '관리자 제출 마일스톤 4종 공개와 제출 규칙 설정',
      async () => {
        milestones = await createMilestones(admin, run, [
          '제안서',
          '중간 점검',
          '발표',
          '최종 보고서',
        ]);
        await json('milestones.json', milestones);
      },
    );
    await phase('06', '팀장 로그인과 주제 후보·프로젝트 확정', async () => {
      await createProject(await student('leader'), run.title, [
        await student('memberA'),
        await student('memberB'),
        await student('memberC'),
      ]);
    });
    await phase('M01', '팀장 회의록 작성과 재조회', async () => {
      await createMeeting(
        await student('leader'),
        run,
        async () => {
          resources.meeting.state = 'unknown';
          await saveResources();
        },
        async path => {
          resources.meeting.studentDetailPath = path;
          resources.meeting.state = 'created';
          resources.meeting.lastVerifiedStage = 'M01';
          await saveResources();
        },
      );
    });
    await phase('M02', '담당자·기한이 있는 회의 액션 등록', async () => {
      resources.action.owningMeetingPath = ownedMeeting();
      await saveResources();
      await addMeetingAction(
        await student('leader'),
        run,
        ownedMeeting(),
        async () => {
          resources.action.state = 'unknown';
          await saveResources();
        },
        async () => {
          resources.action.state = 'created';
          await saveResources();
        },
      );
    });
    await phase('M03', '같은 팀원 원본 회의·팀 액션 플랜 조회', async () => {
      const page = await student('memberA');
      await memberMeeting(page, run, ownedMeeting());
      await evidence(page, 'M03-member-original');
    });
    await phase(
      'M04',
      '관리자 분반·팀 필터와 읽기 전용 원본 본문',
      async () => {
        await adminReadMeeting(
          admin,
          run,
          ownedMeeting(),
          false,
          async (detail, list) => {
            resources.meeting.adminDetailPath = detail;
            resources.meeting.adminListPath = list;
            await saveResources();
          },
          loginAdmin,
        );
        await evidence(admin, 'M04-admin-original');
      },
    );
    await phase('M05', '다른 팀 직접 접근과 실제 서버 거부', async () => {
      await deniedMeeting(
        await student('comparisonLeader'),
        run,
        ownedMeeting(),
      );
    });
    await phase('M06', '삭제 취소 후 회의·액션 보존', async () => {
      await cancelDeleteMeeting(await student('leader'), run, ownedMeeting());
      const page = await student('memberA');
      await teamActionPlan(page);
      await readAction(page, run, true, ownedMeeting());
    });
    await phase('M07', '실제 편집 잠금으로 제목·본문 수정', async () => {
      await editMeeting(
        await student('leader'),
        run,
        ownedMeeting(),
        async () => {
          resources.meeting.edited = true;
          resources.meeting.lastVerifiedStage = 'M07';
          await saveResources();
        },
      );
    });
    await phase('M08', '같은 팀원 수정 본문·액션 링크 재조회', async () => {
      const page = await student('memberA');
      await memberMeeting(page, run, ownedMeeting(), true);
      await evidence(page, 'M08-member-updated');
    });
    await phase('M09', '관리자 수정 본문·목록 재조회', async () => {
      await adminReadMeeting(
        admin,
        run,
        ownedMeeting(),
        true,
        async (detail, list) => {
          resources.meeting.adminDetailPath = detail;
          resources.meeting.adminListPath = list;
          await saveResources();
        },
        loginAdmin,
      );
      await evidence(admin, 'M09-admin-updated');
    });
    await phase('M10', '소유 회의록 최종 UI 삭제', async () => {
      await deleteMeeting(
        await student('leader'),
        ownedMeeting(),
        async () => {
          resources.meeting.deletionAttempt = 'M10';
          resources.meeting.deletionResult = 'unknown';
          await saveResources();
        },
        async () => {
          resources.meeting.state = 'deleted';
          resources.meeting.deletionResult = 'UI navigated to list';
          resources.meeting.lastVerifiedStage = 'M10';
          await saveResources();
        },
      );
    });
    await phase(
      'M11',
      '팀장·팀원 회의 삭제와 액션 연쇄 삭제 확인',
      async () => {
        for (const role of ['leader', 'memberA'] as const)
          await studentMeetingDeleted(await student(role), run, ownedMeeting());
        resources.action.state = 'deleted';
        resources.action.cascadeVerified = true;
        await saveResources();
      },
    );
    await phase(
      'M12',
      '관리자 삭제 목록과 기존 상세의 missing 상태',
      async () => {
        resources.meeting.adminListPath = await adminMeetingDeleted(
          admin,
          run,
          ownedMeeting(),
          loginAdmin,
        );
        resources.meeting.lastVerifiedStage = 'M12';
        await saveResources();
      },
    );
    await phase('N01', '교수의 생성 분반 텍스트 공지 게시·재조회', async () => {
      await createNotice(
        admin,
        run,
        async () => {
          resources.notice.state = 'unknown';
          await saveResources();
        },
        async path => {
          resources.notice.adminPath = path;
          resources.notice.state = 'created';
          await saveResources();
        },
      );
      await admin.goto(ownedNotice());
      await readNotice(admin, run, false, true);
      await evidence(admin, 'N01-admin-created');
    });
    await phase('N02', '학생 새 글→읽음과 새로고침 지속성', async () => {
      const page = await student('memberA');
      await studentReadsNotice(
        page,
        run,
        ownedNotice(),
        name => evidence(page, `N02-student-${name}`),
        async path => {
          resources.notice.studentPath = path;
          await saveResources();
        },
      );
    });
    await phase('N03', '같은 공지 제목·본문 수정과 재조회', async () => {
      resources.notice.editState = 'unknown';
      await saveResources();
      await editNotice(admin, run, ownedNotice(), async () => {
        resources.notice.editState = 'updated';
        await saveResources();
      });
      await evidence(admin, 'N03-admin-updated');
    });
    await phase('N04', '학생 수정 공지 영속 조회', async () => {
      const page = await student('memberA');
      await studentUpdatedNotice(page, run, ownedNotice());
      resources.notice.state = 'residual';
      await saveResources();
      await evidence(page, 'N04-student-updated');
    });
    await phase('07', '제안서 전체 영역 작성·이미지 업로드·제출', async () => {
      await submitProposal(await student('leader'), run, milestone('제안서'));
    });
    await phase('08', '관리자 제안서 조회·피드백과 학생 답변', async () => {
      const feedback = await proposalFeedback(admin, run);
      const proposalDetailPath = currentProposalDetailPath(admin.url());
      await (await student('leader')).goto('/student');
      await expect(
        (await student('leader')).getByText(feedback, { exact: true }),
      ).toBeVisible();
      await (
        await student('leader')
      )
        .getByRole('textbox', { name: /^피드백 반영 답변/ })
        .fill(`예외 처리 계획을 추가했습니다. ${run.key}`);
      await (
        await student('leader')
      )
        .getByRole('button', { name: '답변 보내기', exact: true })
        .click();
      await expect(
        (await student('leader')).getByText('피드백 반영 답변을 제출했어요.', {
          exact: true,
        }),
      ).toBeVisible();
      // The proposal detail was already proven through the selected submitted
      // card above. Re-open that exact resource after the student's reply;
      // a fresh list read can temporarily project the document as unsubmitted.
      await admin.goto(proposalDetailPath);
      await expect(
        admin.getByRole('heading', { name: '제출물 > 제안서', exact: true }),
      ).toBeVisible();
      await expect(
        admin.getByText(`예외 처리 계획을 추가했습니다. ${run.key}`, {
          exact: true,
        }),
      ).toBeVisible();
    });
    await phase('09', '중간 점검 작성·자동 저장·제출', async () => {
      await submitMidReport(await student('leader'), milestone('중간 점검'));
    });
    await phase('10', '관리자 수정 요청과 학생 수정본 재제출', async () => {
      await midReportFeedback(admin, run);
      await submitMidReport(
        await student('leader'),
        milestone('중간 점검'),
        true,
      );
      await submissionDetail(admin, run, '중간 점검');
      await expect(
        admin.getByText(/상태: SUBMITTED · 현재 버전:/),
      ).toBeVisible();
      await expect(admin.getByText(/수정본 topic 1/)).toBeVisible();
    });
    await phase('11', '두 팀의 발표 자료 제출·새 버전 업로드', async () => {
      await uploadPdf(await student('leader'), milestone('발표'));
      await uploadPdf(await student('leader'), milestone('발표'), false, 2);
      const comparison = await student('comparisonLeader');
      await createProject(comparison, `${run.title} 비교`, [
        await student('comparisonMember'),
      ]);
      await uploadPdf(comparison, milestone('발표'));
    });
    await phase(
      '12',
      '관리자 발표 버전 조회·순서·평가 항목·기간 설정',
      async () => {
        await downloadSubmission(admin, run, '발표 자료 제출', 2);
        await openPresentationWindow(admin, run, milestone('발표'));
        await presentationSettings(admin, run);
      },
    );
    await phase('13', '다른 팀 발표 평가와 관리자 결과 조회', async () => {
      await evaluatePresentation(await student('leader'), run);
      await submissions(admin, run, '발표 평가');
      await expect(
        admin.getByRole('columnheader', {
          name: '설계 완성도 (5)',
          exact: true,
        }),
      ).toBeVisible();
      const row = admin.getByRole('row', {
        name: presentationEvaluationRowName(run.comparison),
        exact: true,
      });
      await expect(row).toBeVisible();
      await expect(row.getByRole('cell', { name: '5', exact: true })).toHaveCount(
        2,
      );
      await expect(
        row.getByRole('cell', { name: '1건', exact: true }),
      ).toBeVisible();
    });
    await phase('14', '최종보고서 PDF 제출', async () => {
      await uploadPdf(await student('leader'), milestone('최종 보고서'), true);
    });
    await phase('15', '팀원 3명 승인과 팀장 최종 완료', async () => {
      for (const role of ['memberA', 'memberB', 'memberC'] as const) {
        const member = await student(role);
        await member.goto('/student');
        const card = studentMilestone(member, milestone('최종 보고서'));
        await card
          .getByRole('button', { name: '승인하기', exact: true })
          .click();
        await expect(
          card.getByRole('button', { name: '승인 취소', exact: true }),
        ).toBeEnabled();
      }
      await (await student('leader')).goto('/student');
      const card = studentMilestone(
        await student('leader'),
        milestone('최종 보고서'),
      );
      await card
        .getByRole('button', { name: '최종 완료', exact: true })
        .click();
      await expect(
        card.getByRole('button', { name: '완료', exact: true }),
      ).toBeDisabled();
      await (await student('leader')).reload();
      await expect(
        card.getByText('승인 4/4명 · 완료', { exact: true }),
      ).toBeVisible();
      await expect(
        card.getByRole('button', { name: '완료', exact: true }),
      ).toBeDisabled();
    });
    await phase('16', '관리자 최종보고서 파일 조회', async () => {
      await downloadSubmission(admin, run, '최종 보고서', 1);
    });
    await phase('17', '관리자 상호평가 개설', async () => {
      Object.assign(
        milestones,
        await createMilestones(admin, run, ['상호 평가']),
      );
      await json('milestones.json', milestones);
    });
    await phase('18', '학생 상호평가 제출과 관리자 결과 조회', async () => {
      await submitPeerEvaluation(await student('leader'));
      await submissions(admin, run, '상호 평가');
      await admin
        .getByRole('row', {
          name: `${run.team} 상호평가 보기`,
          exact: true,
        })
        .click();
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
  } finally {
    currentStage = 'cleanup';
    // One bounded cleanup for a known record whose acceptance failed before M10.
    // Never repeat an ambiguous delete or search arbitrary records.
    try {
      if (
        resources.meeting.studentDetailPath &&
        resources.meeting.state !== 'deleted' &&
        !resources.meeting.deletionAttempt
      ) {
        await test.step(
          '소유 회의록 잔여 정리 (성공 단계로 계산하지 않음)',
          async () => {
            await deleteMeeting(
              await student('leader'),
              ownedMeeting(),
              async () => {
                resources.meeting.deletionAttempt = 'cleanup';
                resources.meeting.deletionResult = 'unknown';
                await saveResources();
              },
              async () => {
                resources.meeting.state = 'deleted';
                resources.meeting.deletionResult =
                  'cleanup UI navigated to list';
                await saveResources();
              },
            );
          },
          { timeout: 60_000 },
        );
      }
      resources.cleanup.result =
        resources.meeting.state === 'deleted'
          ? 'meeting deleted; notice and base resources retained'
          : 'manual handoff';
    } catch (error) {
      resources.meeting.state = 'residual';
      resources.cleanup.result = 'failed';
      resources.cleanup.reason = safeError(error);
    } finally {
      const writes = await Promise.allSettled([
        saveResources(),
        json('network.json', network),
        json('requests.json', requests),
        json('outcomes.json', runner.outcomes),
        json('browser-errors.json', errors),
        json('console-errors.json', consoleErrors),
        json(
          'unexpected-console-errors.json',
          unexpectedConsoleErrors(consoleErrors, network),
        ),
        json('login-recoveries.json', loginRecoveries),
        json('evidence-errors.json', runner.evidenceErrors),
      ]);
      writes.forEach(result => {
        if (result.status === 'rejected')
          runner.evidenceErrors.push(safeError(result.reason));
      });
      await Promise.allSettled(contexts.map(context => context.close()));
    }
  }
  expect(errors, '브라우저 JavaScript 오류 (단계·배우 포함)').toEqual([]);
  expect(unversionedApiRequests(requests), '/api/v1/ 외 API 요청 경로').toEqual(
    [],
  );
  expect(
    unexpectedConsoleErrors(consoleErrors, network),
    '예상된 리소스 응답 외 콘솔 오류',
  ).toEqual([]);
  expect(runner.evidenceErrors, '증거 저장 오류').toEqual([]);
  const unsuccessful = runner.outcomes.filter(
    outcome => outcome.status !== 'passed',
  );
  expect(runner.outcomes).toHaveLength(34);
  expect(
    unsuccessful,
    '실패·의존성 건너뜀은 성공이 아님. outcomes.json 확인',
  ).toEqual([]);
});
