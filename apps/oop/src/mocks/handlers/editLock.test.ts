import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import type {
  EditLockTarget,
  EditLockStatus,
  MidReport,
  Presentation,
  Proposal,
} from '@aics/core';
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

import {
  EDIT_LOCK_TTL_MS,
  editLockHandlers,
  resetEditLockFixture,
} from './editLock';
import { midReportHandlers } from './midReport';
import { presentationHandlers } from './presentation';
import { proposalHandlers } from './proposal';
import { getCurrentMidReport, resetMidReportMockData } from '../data/midReport';
import {
  getCurrentPresentation,
  resetPresentationMockData,
} from '../data/presentation';
import { getCurrentProposal, resetProposalFixture } from '../data/proposal';
import { demoAccessToken, demoPartnerAccessToken } from '../data/users';

const studentHeaders = {
  Authorization: `Bearer ${demoAccessToken}`,
  'Content-Type': 'application/json',
};
const partnerHeaders = {
  Authorization: `Bearer ${demoPartnerAccessToken}`,
  'Content-Type': 'application/json',
};

const server = setupServer(
  ...editLockHandlers,
  ...proposalHandlers,
  ...midReportHandlers,
  ...presentationHandlers,
);

type LockTarget = EditLockTarget;

type ApiError = {
  code: string;
  message: string;
};

async function acquireLock(target: LockTarget, headers = partnerHeaders) {
  const response = await fetch(`${API_BASE_URL}${ENDPOINTS.EDIT_LOCKS.ROOT}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(target),
  });
  const body = (await response.json()) as EditLockStatus | ApiError;
  return { response, body };
}

async function releaseLock(
  target: LockTarget,
  leaseId: string,
  headers = partnerHeaders,
) {
  const url = new URL(`${API_BASE_URL}${ENDPOINTS.EDIT_LOCKS.ROOT}`);
  url.search = new URLSearchParams({ ...target, leaseId }).toString();
  return fetch(url, { method: 'DELETE', headers });
}

function editLockTarget(
  targetType: LockTarget['targetType'],
  targetId: string,
): LockTarget {
  return { targetType, targetId };
}

function leaseIdFrom(body: EditLockStatus | ApiError) {
  if (!('leaseId' in body) || typeof body.leaseId !== 'string')
    throw new Error('a successful lock response must include a leaseId');
  return body.leaseId;
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  resetEditLockFixture();
  resetMidReportMockData();
  resetProposalFixture();
  resetPresentationMockData();
});
afterEach(() => {
  vi.useRealTimers();
  server.resetHandlers();
});
afterAll(() => server.close());

describe('edit lock handler contract', () => {
  it('keeps a same-user second lease alive when only the first lease is released', async () => {
    const target = editLockTarget('PROJECT_BLOCK', 'proposal-team-07:topic');

    const first = await acquireLock(target, studentHeaders);
    const second = await acquireLock(target, studentHeaders);
    expect(first.response.status).toBe(200);
    expect(second.response.status).toBe(200);

    const firstLeaseId = leaseIdFrom(first.body);
    const secondLeaseId = leaseIdFrom(second.body);
    expect(secondLeaseId).not.toBe(firstLeaseId);

    await expect(
      releaseLock(target, firstLeaseId, studentHeaders),
    ).resolves.toMatchObject({ status: 204 });

    const blockedWhileSecondLeaseExists = await acquireLock(
      target,
      partnerHeaders,
    );
    expect(blockedWhileSecondLeaseExists.response.status).toBe(409);
    expect(blockedWhileSecondLeaseExists.body).toMatchObject({
      code: 'EDIT_LOCKED',
    });

    await expect(
      releaseLock(target, secondLeaseId, studentHeaders),
    ).resolves.toMatchObject({
      status: 204,
    });

    const acquiredAfterBothLeasesRelease = await acquireLock(
      target,
      partnerHeaders,
    );
    expect(acquiredAfterBothLeasesRelease.response.status).toBe(200);
    expect(
      (acquiredAfterBothLeasesRelease.body as EditLockStatus).leaseId,
    ).toBeTruthy();
  });

  it('expires a lease after the TTL so another user can acquire the target', async () => {
    vi.useFakeTimers({ now: new Date('2026-10-01T00:00:00.000Z') });
    resetEditLockFixture();
    const target = editLockTarget(
      'MID_REPORT_BLOCK',
      'mid-report-team-07:topic',
    );

    const first = await acquireLock(target, studentHeaders);
    expect(first.response.status).toBe(200);

    vi.advanceTimersByTime(EDIT_LOCK_TTL_MS + 1);

    const acquiredAfterExpiry = await acquireLock(target, partnerHeaders);
    expect(acquiredAfterExpiry.response.status).toBe(200);
    expect((acquiredAfterExpiry.body as EditLockStatus).lockedBy).toBe(
      'OOP 데모 학생 B',
    );
  });

  it('projects a foreign dynamic lock onto the matching proposal block', async () => {
    const target = editLockTarget('PROJECT_BLOCK', 'proposal-team-07:topic');
    const lock = await acquireLock(target, partnerHeaders);
    expect(lock.response.status).toBe(200);

    const response = await fetch(
      `${API_BASE_URL}${ENDPOINTS.PROPOSAL.CURRENT}`,
      { headers: studentHeaders },
    );
    const proposal = (await response.json()) as Proposal;

    expect(response.status).toBe(200);
    expect(proposal.blocks.find(block => block.key === 'topic')?.lock).toEqual({
      ownerName: 'OOP 데모 학생 B',
    });
  });

  it.each([
    {
      label: 'proposal',
      target: editLockTarget(
        'PROJECT_BLOCK',
        'proposal-team-07:data-composition',
      ),
      lockedBlockKey: 'data-composition',
      getDocument: getCurrentProposal,
      saveUrl: (id: string, blockKey: string) =>
        `${API_BASE_URL}${ENDPOINTS.PROPOSAL.BLOCK(id, blockKey)}`,
      completionUrl: (id: string, blockKey: string) =>
        `${API_BASE_URL}${ENDPOINTS.PROPOSAL.BLOCK_COMPLETION(id, blockKey)}`,
    },
    {
      label: 'mid report',
      target: editLockTarget(
        'MID_REPORT_BLOCK',
        'mid-report-team-07:engine-design',
      ),
      lockedBlockKey: 'engine-design',
      getDocument: getCurrentMidReport,
      saveUrl: (id: string, blockKey: string) =>
        `${API_BASE_URL}${ENDPOINTS.MID_REPORT.BLOCK(id, blockKey)}`,
      completionUrl: (id: string, blockKey: string) =>
        `${API_BASE_URL}${ENDPOINTS.MID_REPORT.BLOCK_COMPLETION(id, blockKey)}`,
    },
    {
      label: 'presentation',
      target: editLockTarget(
        'PRESENTATION_CONTENT_BLOCK',
        'presentation-team-07:main-screens',
      ),
      lockedBlockKey: 'main-screens',
      getDocument: getCurrentPresentation,
      saveUrl: (id: string, blockKey: string) =>
        `${API_BASE_URL}${ENDPOINTS.PRESENTATION.BLOCK(id, blockKey)}`,
      completionUrl: (id: string, blockKey: string) =>
        `${API_BASE_URL}${ENDPOINTS.PRESENTATION.BLOCK_COMPLETION(id, blockKey)}`,
    },
  ])(
    'keeps other-block foreign locks in $label save and completion responses',
    async scenario => {
      const lock = await acquireLock(scenario.target, partnerHeaders);
      expect(lock.response.status).toBe(200);

      const document = scenario.getDocument();
      const editableBlock =
        document.blocks.find(block => block.key === 'topic') ??
        document.blocks.find(block => block.key === 'project-overview');
      if (!editableBlock) throw new Error('editable block fixture is required');
      const saveResponse = await fetch(
        scenario.saveUrl(document.id, editableBlock.key),
        {
          method: 'PATCH',
          headers: studentHeaders,
          body: JSON.stringify({
            version: document.version,
            fields: editableBlock.fields,
          }),
        },
      );
      const saved = (await saveResponse.json()) as
        Proposal | MidReport | Presentation;

      expect(saveResponse.status).toBe(200);
      expect(
        saved.blocks.find(block => block.key === scenario.lockedBlockKey)?.lock,
      ).toEqual({ ownerName: 'OOP 데모 학생 B' });

      const completionResponse = await fetch(
        scenario.completionUrl(saved.id, editableBlock.key),
        {
          method: 'POST',
          headers: studentHeaders,
          body: JSON.stringify({ version: saved.version }),
        },
      );
      const completed = (await completionResponse.json()) as
        Proposal | MidReport | Presentation;

      expect(completionResponse.status).toBe(200);
      expect(
        completed.blocks.find(block => block.key === scenario.lockedBlockKey)
          ?.lock,
      ).toEqual({ ownerName: 'OOP 데모 학생 B' });
    },
  );

  it('recovers a different-block save after refetching the global document version', async () => {
    const report = getCurrentMidReport();
    const topic = report.blocks.find(block => block.key === 'topic');
    const projectPlan = report.blocks.find(
      block => block.key === 'project-plan',
    );
    if (!topic || !projectPlan)
      throw new Error('mid report block fixtures are required');

    const firstSave = await fetch(
      `${API_BASE_URL}${ENDPOINTS.MID_REPORT.BLOCK(report.id, topic.key)}`,
      {
        method: 'PATCH',
        headers: studentHeaders,
        body: JSON.stringify({ version: report.version, fields: topic.fields }),
      },
    );
    expect(firstSave.status).toBe(200);

    const staleSave = await fetch(
      `${API_BASE_URL}${ENDPOINTS.MID_REPORT.BLOCK(
        report.id,
        projectPlan.key,
      )}`,
      {
        method: 'PATCH',
        headers: partnerHeaders,
        body: JSON.stringify({
          version: report.version,
          fields: projectPlan.fields,
        }),
      },
    );
    expect(staleSave.status).toBe(409);
    await expect(staleSave.json()).resolves.toMatchObject({
      code: 'VERSION_CONFLICT',
    });

    const refreshedResponse = await fetch(
      `${API_BASE_URL}${ENDPOINTS.MID_REPORT.CURRENT}`,
      { headers: partnerHeaders },
    );
    const refreshed = (await refreshedResponse.json()) as MidReport;
    const retriedSave = await fetch(
      `${API_BASE_URL}${ENDPOINTS.MID_REPORT.BLOCK(
        refreshed.id,
        projectPlan.key,
      )}`,
      {
        method: 'PATCH',
        headers: partnerHeaders,
        body: JSON.stringify({
          version: refreshed.version,
          fields: projectPlan.fields,
        }),
      },
    );

    expect(refreshed.version).toBe(report.version + 1);
    expect(retriedSave.status).toBe(200);
  });

  it('returns a version conflict before stale completion eligibility is evaluated', async () => {
    const proposal = getCurrentProposal();
    const topic = proposal.blocks.find(block => block.key === 'topic');
    if (!topic) throw new Error('proposal topic fixture is required');

    const collaboratorSave = await fetch(
      `${API_BASE_URL}${ENDPOINTS.PROPOSAL.BLOCK(proposal.id, topic.key)}`,
      {
        method: 'PATCH',
        headers: partnerHeaders,
        body: JSON.stringify({
          version: proposal.version,
          fields: topic.fields.map(field =>
            field.key === 'title' ? { ...field, value: '' } : field,
          ),
        }),
      },
    );
    expect(collaboratorSave.status).toBe(200);

    const staleCompletion = await fetch(
      `${API_BASE_URL}${ENDPOINTS.PROPOSAL.BLOCK_COMPLETION(
        proposal.id,
        topic.key,
      )}`,
      {
        method: 'POST',
        headers: studentHeaders,
        body: JSON.stringify({ version: proposal.version }),
      },
    );

    expect(staleCompletion.status).toBe(409);
    await expect(staleCompletion.json()).resolves.toMatchObject({
      code: 'VERSION_CONFLICT',
    });
    expect(
      getCurrentProposal().blocks.find(block => block.key === topic.key)
        ?.status,
    ).toBe('IN_PROGRESS');
  });

  it('returns a version conflict when a concurrent save makes a stale submission ineligible', async () => {
    let readyProposal = getCurrentProposal();
    for (const block of readyProposal.blocks.filter(
      item => item.status !== 'COMPLETED',
    )) {
      const completion = await fetch(
        `${API_BASE_URL}${ENDPOINTS.PROPOSAL.BLOCK_COMPLETION(
          readyProposal.id,
          block.key,
        )}`,
        {
          method: 'POST',
          headers: studentHeaders,
          body: JSON.stringify({ version: readyProposal.version }),
        },
      );
      expect(completion.status).toBe(200);
      readyProposal = (await completion.json()) as Proposal;
    }
    expect(
      readyProposal.blocks.every(block => block.status === 'COMPLETED'),
    ).toBe(true);

    const staleVersion = readyProposal.version;
    const topic = readyProposal.blocks.find(block => block.key === 'topic');
    if (!topic) throw new Error('proposal topic fixture is required');
    const collaboratorSave = await fetch(
      `${API_BASE_URL}${ENDPOINTS.PROPOSAL.BLOCK(readyProposal.id, topic.key)}`,
      {
        method: 'PATCH',
        headers: partnerHeaders,
        body: JSON.stringify({
          version: staleVersion,
          fields: topic.fields.map(field =>
            field.key === 'title'
              ? { ...field, value: `${field.value} 수정` }
              : field,
          ),
        }),
      },
    );
    expect(collaboratorSave.status).toBe(200);

    const staleSubmission = await fetch(
      `${API_BASE_URL}${ENDPOINTS.PROPOSAL.SUBMIT(readyProposal.id)}`,
      {
        method: 'POST',
        headers: studentHeaders,
        body: JSON.stringify({ version: staleVersion }),
      },
    );

    expect(staleSubmission.status).toBe(409);
    await expect(staleSubmission.json()).resolves.toMatchObject({
      code: 'VERSION_CONFLICT',
    });
    expect(
      getCurrentProposal().blocks.find(block => block.key === topic.key)
        ?.status,
    ).toBe('IN_PROGRESS');
  });

  it.each([
    {
      label: 'proposal',
      target: editLockTarget('PROJECT_BLOCK', 'proposal-team-07:topic'),
      request: () => {
        const document = getCurrentProposal();
        return fetch(
          `${API_BASE_URL}${ENDPOINTS.PROPOSAL.BLOCK_COMPLETION(
            document.id,
            'topic',
          )}`,
          {
            method: 'POST',
            headers: studentHeaders,
            body: JSON.stringify({ version: document.version }),
          },
        );
      },
    },
    {
      label: 'mid report',
      target: editLockTarget('MID_REPORT_BLOCK', 'mid-report-team-07:topic'),
      request: () => {
        const document = getCurrentMidReport();
        return fetch(
          `${API_BASE_URL}${ENDPOINTS.MID_REPORT.BLOCK_COMPLETION(
            document.id,
            'topic',
          )}`,
          {
            method: 'POST',
            headers: studentHeaders,
            body: JSON.stringify({ version: document.version }),
          },
        );
      },
    },
    {
      label: 'presentation',
      target: editLockTarget(
        'PRESENTATION_CONTENT_BLOCK',
        'presentation-team-07:project-overview',
      ),
      request: () => {
        const document = getCurrentPresentation();
        return fetch(
          `${API_BASE_URL}${ENDPOINTS.PRESENTATION.BLOCK_COMPLETION(
            document.id,
            'project-overview',
          )}`,
          {
            method: 'POST',
            headers: studentHeaders,
            body: JSON.stringify({ version: document.version }),
          },
        );
      },
    },
  ])(
    'rejects $label completion while its block is foreign-locked',
    async scenario => {
      const lock = await acquireLock(scenario.target, partnerHeaders);
      expect(lock.response.status).toBe(200);

      const response = await scenario.request();
      expect(response.status).toBe(409);
      await expect(response.json()).resolves.toMatchObject({
        code: 'BLOCK_LOCKED',
      });
    },
  );

  it.each([
    {
      label: 'proposal',
      target: editLockTarget('PROJECT_BLOCK', 'proposal-team-07:team-info'),
      request: () => {
        const document = getCurrentProposal();
        return fetch(
          `${API_BASE_URL}${ENDPOINTS.PROPOSAL.SUBMIT(document.id)}`,
          {
            method: 'POST',
            headers: studentHeaders,
            body: JSON.stringify({ version: document.version }),
          },
        );
      },
    },
    {
      label: 'mid report',
      target: editLockTarget(
        'MID_REPORT_BLOCK',
        'mid-report-team-07:engine-design',
      ),
      request: () => {
        const document = getCurrentMidReport();
        return fetch(
          `${API_BASE_URL}${ENDPOINTS.MID_REPORT.SUBMIT(document.id)}`,
          {
            method: 'POST',
            headers: studentHeaders,
            body: JSON.stringify({ version: document.version }),
          },
        );
      },
    },
    {
      label: 'presentation',
      target: editLockTarget(
        'PRESENTATION_CONTENT_BLOCK',
        'presentation-team-07:main-screens',
      ),
      request: () => {
        const document = getCurrentPresentation();
        return fetch(
          `${API_BASE_URL}${ENDPOINTS.PRESENTATION.SUBMIT(document.id)}`,
          {
            method: 'POST',
            headers: studentHeaders,
            body: JSON.stringify({ version: document.version }),
          },
        );
      },
    },
  ])(
    'rejects $label submission when any document block is foreign-locked',
    async scenario => {
      const lock = await acquireLock(scenario.target, partnerHeaders);
      expect(lock.response.status).toBe(200);

      const response = await scenario.request();
      expect(response.status).toBe(409);
      await expect(response.json()).resolves.toMatchObject({
        code: 'DOCUMENT_LOCKED',
      });
    },
  );
});
