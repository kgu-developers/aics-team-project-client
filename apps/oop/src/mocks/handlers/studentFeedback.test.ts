import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import type { MidReport, Proposal, StudentHomeDashboard } from '@aics/core';
import { setupServer } from 'msw/node';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { EDIT_LOCK_TTL_MS } from './editLock';
import { midReportHandlers } from './midReport';
import { proposalHandlers } from './proposal';
import { studentFeedbackHandlers } from './studentFeedback';
import {
  resetStudentHomePreviewTransitionState,
  studentHomeHandlers,
} from './studentHome';
import { resetMidReportMockData } from '../data/midReport';
import { resetProposalFixture } from '../data/proposal';
import {
  demoMidReportSubmissionId,
  demoProposalReviewId,
  resetStudentFeedbackMockData,
} from '../data/studentFeedback';
import {
  demoAccessToken,
  demoAdminAccessToken,
  demoPartnerAccessToken,
} from '../data/users';

const sectionId = 'oop-2026-2-01';
const server = setupServer(
  ...midReportHandlers,
  ...proposalHandlers,
  ...studentFeedbackHandlers,
  ...studentHomeHandlers,
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(Date.now() + EDIT_LOCK_TTL_MS + 1);
});
afterEach(() => {
  resetStudentHomePreviewTransitionState();
  resetStudentFeedbackMockData();
  resetProposalFixture();
  resetMidReportMockData();
  server.resetHandlers();
  vi.useRealTimers();
});
afterAll(() => server.close());

function authorization(token = demoAccessToken) {
  return { Authorization: `Bearer ${token}` };
}

async function fetchDashboard(preview: string, token = demoAccessToken) {
  const response = await fetch(
    `${API_BASE_URL}${ENDPOINTS.SECTION.STUDENT_DASHBOARD(sectionId)}`,
    {
      headers: {
        ...authorization(token),
        'X-OOP-Milestone-Preview': preview,
      },
    },
  );
  return {
    dashboard: (await response.json()) as StudentHomeDashboard,
    response,
  };
}

async function getStudentResource<T>(path: string) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: authorization(),
  });
  expect(response.status).toBe(200);
  return (await response.json()) as T;
}

async function sendStudentJson(path: string, body: unknown, method = 'POST') {
  return fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      ...authorization(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

async function submitInitialProposal() {
  let proposal = await getStudentResource<Proposal>(ENDPOINTS.PROPOSAL.CURRENT);
  for (const block of proposal.blocks.filter(
    item => item.status !== 'COMPLETED',
  )) {
    const response = await sendStudentJson(
      ENDPOINTS.PROPOSAL.BLOCK_COMPLETION(proposal.id, block.key),
      { version: proposal.version },
    );
    expect(response.status).toBe(200);
    proposal = (await response.json()) as Proposal;
  }
  const response = await sendStudentJson(
    ENDPOINTS.PROPOSAL.SUBMIT(proposal.id),
    { version: proposal.version },
  );
  expect(response.status).toBe(200);
  return (await response.json()) as Proposal;
}

async function submitInitialMidReport() {
  let report = await getStudentResource<MidReport>(
    ENDPOINTS.MID_REPORT.CURRENT,
  );
  for (const block of report.blocks) {
    const response = await sendStudentJson(
      ENDPOINTS.MID_REPORT.BLOCK_COMPLETION(report.id, block.key),
      { version: report.version },
    );
    expect(response.status).toBe(200);
    report = (await response.json()) as MidReport;
  }
  const response = await sendStudentJson(
    ENDPOINTS.MID_REPORT.SUBMIT(report.id),
    { version: report.version },
  );
  expect(response.status).toBe(200);
  return (await response.json()) as MidReport;
}

describe('student feedback handlers', () => {
  it('제안서를 최초 제출하고 수정 요청 블록을 실제 변경·완료·재제출한 뒤에만 답변을 저장한다', async () => {
    const originalSubmission = await submitInitialProposal();
    expect(originalSubmission).toMatchObject({
      status: 'SUBMITTED',
      revision: null,
    });

    const initial = await fetchDashboard('proposal-feedback');
    const initialBody = initial.dashboard.milestones.find(
      milestone => milestone.id === 'proposal',
    )?.body;

    expect(initial.response.status).toBe(200);
    expect(initialBody).toMatchObject({
      kind: 'proposal-feedback',
      reviewId: demoProposalReviewId,
      feedback: [expect.objectContaining({ content: expect.any(String) })],
      canSubmitResponse: false,
      responseBlockedReason:
        '제안서를 수정해 다시 제출한 뒤 반영 답변을 남겨 주세요.',
    });
    expect(
      initialBody?.kind === 'proposal-feedback'
        ? initialBody.studentResponse
        : null,
    ).toBeUndefined();

    const requested = await getStudentResource<Proposal>(
      ENDPOINTS.PROPOSAL.CURRENT,
    );
    expect(requested).toMatchObject({
      status: 'REVISION_REQUESTED',
      revision: {
        affectedBlockKeys: ['topic'],
        changedBlockKeys: [],
        resubmittedAt: null,
      },
    });
    expect(requested.blocks.find(block => block.key === 'topic')?.status).toBe(
      'IN_PROGRESS',
    );

    const rejectedResponse = await sendStudentJson(
      ENDPOINTS.REVIEW.REVISION_RESPONSE(demoProposalReviewId),
      { content: '핵심 사용자와 문제 상황을 구체적으로 수정했습니다.' },
    );
    expect(rejectedResponse.status).toBe(409);
    await expect(rejectedResponse.json()).resolves.toMatchObject({
      code: 'PROPOSAL_REVISION_RESUBMISSION_REQUIRED',
    });

    const topic = requested.blocks.find(block => block.key === 'topic');
    if (!topic) throw new Error('proposal revision topic is required');
    const completedWithoutChangeResponse = await sendStudentJson(
      ENDPOINTS.PROPOSAL.BLOCK_COMPLETION(requested.id, topic.key),
      { version: requested.version },
    );
    expect(completedWithoutChangeResponse.status).toBe(200);
    const completedWithoutChange =
      (await completedWithoutChangeResponse.json()) as Proposal;
    const unchangedResubmission = await sendStudentJson(
      ENDPOINTS.PROPOSAL.SUBMIT(completedWithoutChange.id),
      { version: completedWithoutChange.version },
    );
    expect(unchangedResubmission.status).toBe(422);
    await expect(unchangedResubmission.json()).resolves.toMatchObject({
      code: 'PROPOSAL_REVISION_CHANGES_REQUIRED',
    });

    const changedTopicFields = topic.fields.map(field =>
      field.key === 'description'
        ? {
            ...field,
            value: `${field.value} 핵심 사용자는 영화관 운영자입니다.`,
          }
        : field,
    );
    const saveResponse = await sendStudentJson(
      ENDPOINTS.PROPOSAL.BLOCK(completedWithoutChange.id, topic.key),
      {
        version: completedWithoutChange.version,
        fields: changedTopicFields,
      },
      'PATCH',
    );
    expect(saveResponse.status).toBe(200);
    const changed = (await saveResponse.json()) as Proposal;
    expect(changed.revision?.changedBlockKeys).toEqual(['topic']);
    expect(changed.blocks.find(block => block.key === 'topic')?.status).toBe(
      'IN_PROGRESS',
    );

    const revertResponse = await sendStudentJson(
      ENDPOINTS.PROPOSAL.BLOCK(changed.id, topic.key),
      { version: changed.version, fields: topic.fields },
      'PATCH',
    );
    expect(revertResponse.status).toBe(200);
    const reverted = (await revertResponse.json()) as Proposal;
    expect(reverted.revision?.changedBlockKeys).toEqual([]);
    const revertedCompletionResponse = await sendStudentJson(
      ENDPOINTS.PROPOSAL.BLOCK_COMPLETION(reverted.id, topic.key),
      { version: reverted.version },
    );
    expect(revertedCompletionResponse.status).toBe(200);
    const revertedCompletion =
      (await revertedCompletionResponse.json()) as Proposal;
    const revertedResubmission = await sendStudentJson(
      ENDPOINTS.PROPOSAL.SUBMIT(revertedCompletion.id),
      { version: revertedCompletion.version },
    );
    expect(revertedResubmission.status).toBe(422);
    await expect(revertedResubmission.json()).resolves.toMatchObject({
      code: 'PROPOSAL_REVISION_CHANGES_REQUIRED',
    });

    const secondSaveResponse = await sendStudentJson(
      ENDPOINTS.PROPOSAL.BLOCK(revertedCompletion.id, topic.key),
      { version: revertedCompletion.version, fields: changedTopicFields },
      'PATCH',
    );
    expect(secondSaveResponse.status).toBe(200);
    const saved = (await secondSaveResponse.json()) as Proposal;
    const completionResponse = await sendStudentJson(
      ENDPOINTS.PROPOSAL.BLOCK_COMPLETION(saved.id, topic.key),
      { version: saved.version },
    );
    expect(completionResponse.status).toBe(200);
    const completed = (await completionResponse.json()) as Proposal;
    const resubmissionResponse = await sendStudentJson(
      ENDPOINTS.PROPOSAL.SUBMIT(completed.id),
      { version: completed.version },
    );
    expect(resubmissionResponse.status).toBe(200);
    await expect(resubmissionResponse.json()).resolves.toMatchObject({
      status: 'SUBMITTED',
      revision: { resubmittedAt: expect.any(String) },
    });

    const readyDashboard = await fetchDashboard('proposal-feedback');
    expect(
      readyDashboard.dashboard.milestones.find(
        milestone => milestone.id === 'proposal',
      )?.body,
    ).toMatchObject({
      kind: 'proposal-feedback',
      canSubmitResponse: true,
    });

    const submitResponse = await sendStudentJson(
      ENDPOINTS.REVIEW.REVISION_RESPONSE(demoProposalReviewId),
      {
        content: '  핵심 사용자와 문제 상황을 구체적으로 수정했습니다.  ',
      },
    );

    expect(submitResponse.status).toBe(201);
    await expect(submitResponse.json()).resolves.toMatchObject({
      reviewId: demoProposalReviewId,
      content: '핵심 사용자와 문제 상황을 구체적으로 수정했습니다.',
      submittedBy: 'OOP 데모 학생 A',
    });

    const teammateDashboard = await fetchDashboard(
      'proposal-feedback',
      demoPartnerAccessToken,
    );
    const teammateBody = teammateDashboard.dashboard.milestones.find(
      milestone => milestone.id === 'proposal',
    )?.body;
    expect(teammateBody).toMatchObject({
      kind: 'proposal-feedback',
      canSubmitResponse: false,
      studentResponse: {
        content: '핵심 사용자와 문제 상황을 구체적으로 수정했습니다.',
        submittedBy: 'OOP 데모 학생 A',
      },
    });

    const duplicateResponse = await fetch(
      `${API_BASE_URL}${ENDPOINTS.REVIEW.REVISION_RESPONSE(demoProposalReviewId)}`,
      {
        method: 'POST',
        headers: {
          ...authorization(demoPartnerAccessToken),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: '두 번째 답변' }),
      },
    );
    expect(duplicateResponse.status).toBe(409);
  });

  it('중간보고서를 최초 제출하고 대면 피드백 대상 블록을 실제 변경·완료·재제출한 뒤 반영 내용을 저장한다', async () => {
    const originalSubmission = await submitInitialMidReport();
    expect(originalSubmission).toMatchObject({
      status: 'SUBMITTED',
      revision: null,
    });

    const initial = await fetchDashboard('mid-feedback');
    const initialBody = initial.dashboard.milestones.find(
      milestone => milestone.id === 'mid-review',
    )?.body;

    expect(initialBody).toMatchObject({
      kind: 'mid-review-feedback',
      submissionId: demoMidReportSubmissionId,
      feedback: [],
      canSubmitResponse: false,
    });
    expect(
      initialBody?.kind === 'mid-review-feedback'
        ? initialBody.studentFeedback
        : null,
    ).toBeUndefined();

    const requested = await getStudentResource<MidReport>(
      ENDPOINTS.MID_REPORT.CURRENT,
    );
    expect(requested).toMatchObject({
      status: 'REVISION_REQUESTED',
      revision: {
        affectedBlockKeys: ['gui-design'],
        changedBlockKeys: [],
        resubmittedAt: null,
      },
    });

    const rejectedResponse = await sendStudentJson(
      ENDPOINTS.SUBMISSION.MID_REPORT_FEEDBACK(demoMidReportSubmissionId),
      {
        content:
          '검색 흐름을 단순화하라는 피드백을 받아 검색 단계를 두 단계로 줄였습니다.',
      },
    );
    expect(rejectedResponse.status).toBe(409);
    await expect(rejectedResponse.json()).resolves.toMatchObject({
      code: 'MID_REPORT_REVISION_RESUBMISSION_REQUIRED',
    });

    const gui = requested.blocks.find(block => block.key === 'gui-design');
    if (!gui) throw new Error('mid-report revision GUI block is required');
    const completedWithoutChangeResponse = await sendStudentJson(
      ENDPOINTS.MID_REPORT.BLOCK_COMPLETION(requested.id, gui.key),
      { version: requested.version },
    );
    expect(completedWithoutChangeResponse.status).toBe(200);
    const completedWithoutChange =
      (await completedWithoutChangeResponse.json()) as MidReport;
    const unchangedResubmission = await sendStudentJson(
      ENDPOINTS.MID_REPORT.SUBMIT(completedWithoutChange.id),
      { version: completedWithoutChange.version },
    );
    expect(unchangedResubmission.status).toBe(422);
    await expect(unchangedResubmission.json()).resolves.toMatchObject({
      code: 'MID_REPORT_REVISION_CHANGES_REQUIRED',
    });

    const changedGuiFields = gui.fields.map(field =>
      field.key === 'guiScreens'
        ? {
            ...field,
            value: field.value.replace(
              '상영 일정과 예매 현황을 확인합니다.',
              '검색 단계를 줄인 상영 일정과 예매 현황을 확인합니다.',
            ),
          }
        : field,
    );
    const saveResponse = await sendStudentJson(
      ENDPOINTS.MID_REPORT.BLOCK(completedWithoutChange.id, gui.key),
      {
        version: completedWithoutChange.version,
        fields: changedGuiFields,
      },
      'PATCH',
    );
    expect(saveResponse.status).toBe(200);
    const changed = (await saveResponse.json()) as MidReport;
    expect(changed.revision?.changedBlockKeys).toEqual(['gui-design']);

    const revertResponse = await sendStudentJson(
      ENDPOINTS.MID_REPORT.BLOCK(changed.id, gui.key),
      { version: changed.version, fields: gui.fields },
      'PATCH',
    );
    expect(revertResponse.status).toBe(200);
    const reverted = (await revertResponse.json()) as MidReport;
    expect(reverted.revision?.changedBlockKeys).toEqual([]);
    const revertedCompletionResponse = await sendStudentJson(
      ENDPOINTS.MID_REPORT.BLOCK_COMPLETION(reverted.id, gui.key),
      { version: reverted.version },
    );
    expect(revertedCompletionResponse.status).toBe(200);
    const revertedCompletion =
      (await revertedCompletionResponse.json()) as MidReport;
    const revertedResubmission = await sendStudentJson(
      ENDPOINTS.MID_REPORT.SUBMIT(revertedCompletion.id),
      { version: revertedCompletion.version },
    );
    expect(revertedResubmission.status).toBe(422);
    await expect(revertedResubmission.json()).resolves.toMatchObject({
      code: 'MID_REPORT_REVISION_CHANGES_REQUIRED',
    });

    const secondSaveResponse = await sendStudentJson(
      ENDPOINTS.MID_REPORT.BLOCK(revertedCompletion.id, gui.key),
      { version: revertedCompletion.version, fields: changedGuiFields },
      'PATCH',
    );
    expect(secondSaveResponse.status).toBe(200);
    const saved = (await secondSaveResponse.json()) as MidReport;
    const completionResponse = await sendStudentJson(
      ENDPOINTS.MID_REPORT.BLOCK_COMPLETION(saved.id, gui.key),
      { version: saved.version },
    );
    expect(completionResponse.status).toBe(200);
    const completed = (await completionResponse.json()) as MidReport;
    const resubmissionResponse = await sendStudentJson(
      ENDPOINTS.MID_REPORT.SUBMIT(completed.id),
      { version: completed.version },
    );
    expect(resubmissionResponse.status).toBe(200);
    await expect(resubmissionResponse.json()).resolves.toMatchObject({
      status: 'SUBMITTED',
      revision: { resubmittedAt: expect.any(String) },
    });

    const readyDashboard = await fetchDashboard('mid-feedback');
    expect(
      readyDashboard.dashboard.milestones.find(
        milestone => milestone.id === 'mid-review',
      )?.body,
    ).toMatchObject({
      kind: 'mid-review-feedback',
      canSubmitResponse: true,
    });

    const submitResponse = await sendStudentJson(
      ENDPOINTS.SUBMISSION.MID_REPORT_FEEDBACK(demoMidReportSubmissionId),
      {
        content:
          '  검색 흐름을 단순화하라는 피드백을 받아 검색 단계를 두 단계로 줄였습니다.  ',
      },
    );

    expect(submitResponse.status).toBe(201);
    const submitted = await fetchDashboard('mid-feedback');
    const submittedBody = submitted.dashboard.milestones.find(
      milestone => milestone.id === 'mid-review',
    )?.body;
    expect(submittedBody).toMatchObject({
      kind: 'mid-review-feedback',
      canSubmitResponse: false,
      studentFeedback: {
        content:
          '검색 흐름을 단순화하라는 피드백을 받아 검색 단계를 두 단계로 줄였습니다.',
        submittedBy: 'OOP 데모 학생 A',
      },
    });
    if (submittedBody?.kind !== 'mid-review-feedback') {
      throw new Error('mid report feedback body is required');
    }
    expect(submittedBody.sections.map(section => section.to)).toEqual([
      '/student/editor/mid-review/topic',
      '/student/editor/mid-review/gui-design',
      '/student/editor/mid-review/engine-design',
      '/student/editor/mid-review/project-plan',
      '/student/editor/mid-review/mid-check-questions',
    ]);
  });

  it('제안서 preview에서 수정 전 차단과 답변 작성 가능 상태를 각각 결정적으로 제공한다', async () => {
    const blocked = await fetchDashboard('proposal-feedback');
    expect(
      blocked.dashboard.milestones.find(
        milestone => milestone.id === 'proposal',
      )?.body,
    ).toMatchObject({
      kind: 'proposal-feedback',
      canSubmitResponse: false,
      responseBlockedReason:
        '제안서를 수정해 다시 제출한 뒤 반영 답변을 남겨 주세요.',
    });

    const ready = await fetchDashboard('proposal-feedback-ready');
    const readyMilestone = ready.dashboard.milestones.find(
      milestone => milestone.id === 'proposal',
    );
    const readyBody = readyMilestone?.body;
    expect(readyMilestone).toMatchObject({
      currentStepLabel: '답변 작성',
      status: 'in-progress',
      statusLabel: '답변 필요',
    });
    expect(readyBody).toMatchObject({
      kind: 'proposal-feedback',
      canSubmitResponse: true,
    });
    expect(readyBody).not.toHaveProperty('responseBlockedReason');
    expect(
      await getStudentResource<Proposal>(ENDPOINTS.PROPOSAL.CURRENT),
    ).toMatchObject({
      status: 'SUBMITTED',
      revision: { resubmittedAt: expect.any(String) },
    });

    const submitResponse = await sendStudentJson(
      ENDPOINTS.REVIEW.REVISION_RESPONSE(demoProposalReviewId),
      { content: '핵심 사용자와 문제 상황을 구체화했습니다.' },
    );
    expect(submitResponse.status).toBe(201);

    const submitted = await fetchDashboard('proposal-feedback-ready');
    expect(
      submitted.dashboard.milestones.find(
        milestone => milestone.id === 'proposal',
      ),
    ).toMatchObject({
      currentStepLabel: '답변 제출 완료',
      status: 'completed',
      statusLabel: '반영 완료',
      body: {
        kind: 'proposal-feedback',
        canSubmitResponse: false,
        studentResponse: {
          content: '핵심 사용자와 문제 상황을 구체화했습니다.',
        },
      },
    });
  });

  it('중간보고서 preview에서 수정 전 차단과 단일 반영 기록 작성 가능 상태를 각각 결정적으로 제공한다', async () => {
    const blocked = await fetchDashboard('mid-feedback');
    expect(
      blocked.dashboard.milestones.find(
        milestone => milestone.id === 'mid-review',
      )?.body,
    ).toMatchObject({
      kind: 'mid-review-feedback',
      canSubmitResponse: false,
      responseBlockedReason:
        '중간보고서를 수정해 다시 제출한 뒤 반영 내용을 남겨 주세요.',
    });

    const ready = await fetchDashboard('mid-feedback-ready');
    const readyMilestone = ready.dashboard.milestones.find(
      milestone => milestone.id === 'mid-review',
    );
    const readyBody = readyMilestone?.body;
    expect(readyMilestone).toMatchObject({
      currentStepLabel: '반영 기록 작성',
      status: 'in-progress',
      statusLabel: '기록 필요',
    });
    expect(readyBody).toMatchObject({
      kind: 'mid-review-feedback',
      canSubmitResponse: true,
    });
    expect(readyBody).not.toHaveProperty('responseBlockedReason');
    expect(
      await getStudentResource<MidReport>(ENDPOINTS.MID_REPORT.CURRENT),
    ).toMatchObject({
      status: 'SUBMITTED',
      revision: { resubmittedAt: expect.any(String) },
    });

    const submitResponse = await sendStudentJson(
      ENDPOINTS.SUBMISSION.MID_REPORT_FEEDBACK(demoMidReportSubmissionId),
      {
        content:
          '검색 흐름을 단순화하라는 피드백을 받아 검색 단계를 두 단계로 줄였습니다.',
      },
    );
    expect(submitResponse.status).toBe(201);

    const submitted = await fetchDashboard('mid-feedback-ready');
    expect(
      submitted.dashboard.milestones.find(
        milestone => milestone.id === 'mid-review',
      ),
    ).toMatchObject({
      currentStepLabel: '반영 기록 완료',
      status: 'completed',
      statusLabel: '반영 완료',
      body: {
        kind: 'mid-review-feedback',
        canSubmitResponse: false,
        studentFeedback: {
          content:
            '검색 흐름을 단순화하라는 피드백을 받아 검색 단계를 두 단계로 줄였습니다.',
        },
      },
    });
  });

  it('개발 preview를 전환하면 이전 문서 변경을 버리고 각 시나리오의 초기 수정 상태를 결정적으로 만든다', async () => {
    await fetchDashboard('proposal-feedback');
    const proposalRevision = await getStudentResource<Proposal>(
      ENDPOINTS.PROPOSAL.CURRENT,
    );
    const topic = proposalRevision.blocks.find(block => block.key === 'topic');
    if (!topic) throw new Error('proposal preview topic is required');
    const proposalSave = await sendStudentJson(
      ENDPOINTS.PROPOSAL.BLOCK(proposalRevision.id, topic.key),
      {
        version: proposalRevision.version,
        fields: topic.fields.map(field =>
          field.key === 'description'
            ? { ...field, value: `${field.value} preview 변경` }
            : field,
        ),
      },
      'PATCH',
    );
    expect(proposalSave.status).toBe(200);

    await fetchDashboard('proposal-feedback');
    expect(
      (await getStudentResource<Proposal>(ENDPOINTS.PROPOSAL.CURRENT)).revision
        ?.changedBlockKeys,
    ).toEqual(['topic']);

    await fetchDashboard('mid-feedback');
    expect(
      await getStudentResource<Proposal>(ENDPOINTS.PROPOSAL.CURRENT),
    ).toMatchObject({ status: 'DRAFT', revision: null });
    expect(
      await getStudentResource<MidReport>(ENDPOINTS.MID_REPORT.CURRENT),
    ).toMatchObject({
      status: 'REVISION_REQUESTED',
      revision: { affectedBlockKeys: ['gui-design'], changedBlockKeys: [] },
    });

    await fetchDashboard('proposal-feedback');
    const restartedProposal = await getStudentResource<Proposal>(
      ENDPOINTS.PROPOSAL.CURRENT,
    );
    expect(restartedProposal).toMatchObject({
      status: 'REVISION_REQUESTED',
      revision: { affectedBlockKeys: ['topic'], changedBlockKeys: [] },
    });
    expect(
      restartedProposal.blocks
        .find(block => block.key === 'topic')
        ?.fields.some(field => field.value.includes('preview 변경')),
    ).toBe(false);
    expect(
      await getStudentResource<MidReport>(ENDPOINTS.MID_REPORT.CURRENT),
    ).toMatchObject({ status: 'DRAFT', revision: null });

    resetProposalFixture();
    await fetchDashboard('proposal-feedback');
    const resetPreviewProposal = await getStudentResource<Proposal>(
      ENDPOINTS.PROPOSAL.CURRENT,
    );
    expect(resetPreviewProposal).toMatchObject({
      status: 'REVISION_REQUESTED',
      revision: { affectedBlockKeys: ['topic'], changedBlockKeys: [] },
    });
    expect(resetPreviewProposal).toEqual(restartedProposal);
  });

  it('공백 입력을 거절하고 학생이 아닌 요청을 권한 오류로 응답한다', async () => {
    const invalidProposal = await fetch(
      `${API_BASE_URL}${ENDPOINTS.REVIEW.REVISION_RESPONSE(demoProposalReviewId)}`,
      {
        method: 'POST',
        headers: {
          ...authorization(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: '   ' }),
      },
    );
    const invalidMidReport = await fetch(
      `${API_BASE_URL}${ENDPOINTS.SUBMISSION.MID_REPORT_FEEDBACK(demoMidReportSubmissionId)}`,
      {
        method: 'POST',
        headers: {
          ...authorization(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: '   ',
        }),
      },
    );
    const unauthorized = await fetch(
      `${API_BASE_URL}${ENDPOINTS.REVIEW.REVISION_RESPONSE(demoProposalReviewId)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: '반영했습니다.' }),
      },
    );
    const forbidden = await fetch(
      `${API_BASE_URL}${ENDPOINTS.REVIEW.REVISION_RESPONSE(demoProposalReviewId)}`,
      {
        method: 'POST',
        headers: {
          ...authorization(demoAdminAccessToken),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: '반영했습니다.' }),
      },
    );

    expect(invalidProposal.status).toBe(422);
    expect(invalidMidReport.status).toBe(422);
    expect(unauthorized.status).toBe(401);
    expect(forbidden.status).toBe(403);
  });
});
