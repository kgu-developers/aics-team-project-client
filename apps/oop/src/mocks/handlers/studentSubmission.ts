import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import type {
  RequiredSubmissionArtifact,
  StudentSubmissionArtifact,
} from '@aics/core';
import { http, HttpResponse } from 'msw';

import { getMockAuthenticatedAccount } from '../authSession';
import { getMockMySections } from '../data/sections';
import { studentMilestoneFixtures } from '../data/studentMilestones';
import {
  storeStudentSubmission,
  submissionConsentFor,
  setSubmissionConsent,
  studentSubmissionFixture,
  studentSubmissionVersionFixtures,
  submissionPreviewPdf,
} from '../data/studentSubmission';

function ownSubmission(request: Request, submissionId: string) {
  const account = getMockAuthenticatedAccount(request);
  if (!account) return new HttpResponse(null, { status: 401 });
  if (account.user.globalRole !== 'STUDENT')
    return new HttpResponse(null, { status: 403 });
  const teamId = Number(account.user.currentTeam?.id.replace(/^team-/, ''));
  const sections = getMockMySections(account.credentials.studentNumber, {
    status: 'ACTIVE',
  });
  const submission = sections
    .flatMap(section => studentMilestoneFixtures(section.id))
    .map(milestone => {
      const value = studentSubmissionFixture(milestone, teamId);
      return {
        ...value,
        memberConsent:
          milestone.type === 'FINAL_REPORT'
            ? submissionConsentFor(
                value,
                milestone.sectionId,
                account.user.studentNumber,
              )
            : null,
      };
    })
    .find(item => String(item.id) === submissionId);
  return submission ?? new HttpResponse(null, { status: 403 });
}
let generation = 0;
function freshVersions(
  submission: Exclude<ReturnType<typeof ownSubmission>, Response>,
) {
  return studentSubmissionVersionFixtures(submission).map(version => ({
    ...version,
    artifacts: version.artifacts.map(artifact =>
      artifact.type === 'FILE'
        ? {
            ...artifact,
            downloadUrl: `${artifact.downloadUrl}?generation=${++generation}`,
          }
        : artifact,
    ),
  }));
}

function artifactRules(milestoneId: number): RequiredSubmissionArtifact[] {
  return [
    {
      id: milestoneId * 10 + 1,
      type: 'FILE',
      label: '제출 PDF',
      required: true,
      allowedExtensions: ['pdf'],
      maxFileSizeMb: 10,
    },
    {
      id: milestoneId * 10 + 2,
      type: 'LINK',
      label: '참고 링크',
      required: false,
      allowedExtensions: [],
      maxFileSizeMb: null,
    },
  ];
}
function consentResponse(
  request: Request,
  id: string,
  action?: 'confirm' | 'cancel' | 'complete',
) {
  const submission = ownSubmission(request, id);
  if (submission instanceof Response) return submission;
  const account = getMockAuthenticatedAccount(request)!;
  if (!submission.memberConsent)
    return HttpResponse.json(
      { code: 'SUBMISSION_MEMBER_CONFIRMATION_NOT_APPLICABLE' },
      { status: 400 },
    );
  if (action === 'complete') {
    if (
      !account.user.currentTeam?.members.some(
        member => member.id === account.user.id && member.isLeader,
      )
    )
      return new HttpResponse(null, { status: 403 });
    if (submission.status !== 'SUBMITTED')
      return new HttpResponse(null, { status: 400 });
    if (
      submission.memberConsent.confirmedCount !==
      submission.memberConsent.totalCount
    )
      return HttpResponse.json(
        { code: 'SUBMISSION_MEMBER_CONFIRMATION_INCOMPLETE' },
        { status: 428 },
      );
    const completed = {
      ...submission,
      status: 'COMPLETED' as const,
      canSubmitNow: false,
    };
    storeStudentSubmission(
      completed,
      studentSubmissionVersionFixtures(submission),
    );
    return HttpResponse.json(completed);
  }
  if (action)
    setSubmissionConsent(
      submission.id,
      account.user.studentNumber,
      action === 'confirm' ? submission.currentVersion : undefined,
    );
  const updated = ownSubmission(request, id);
  return updated instanceof Response
    ? updated
    : HttpResponse.json(updated.memberConsent);
}
export const studentSubmissionHandlers = [
  http.get(
    `${API_BASE_URL}${ENDPOINTS.SUBMISSION.MEMBER_CONFIRMATIONS(':submissionId')}`,
    ({ request, params }) =>
      consentResponse(request, String(params.submissionId)),
  ),
  http.put(
    `${API_BASE_URL}${ENDPOINTS.SUBMISSION.MY_MEMBER_CONFIRMATION(':submissionId')}`,
    ({ request, params }) =>
      consentResponse(request, String(params.submissionId), 'confirm'),
  ),
  http.delete(
    `${API_BASE_URL}${ENDPOINTS.SUBMISSION.MY_MEMBER_CONFIRMATION(':submissionId')}`,
    ({ request, params }) =>
      consentResponse(request, String(params.submissionId), 'cancel'),
  ),
  http.patch(
    `${API_BASE_URL}/submissions/:submissionId/complete`,
    ({ request, params }) =>
      consentResponse(request, String(params.submissionId), 'complete'),
  ),

  http.get(
    `${API_BASE_URL}/api/v1/sections/:sectionId/milestones/:milestoneId/required-artifacts`,
    ({ request, params }) => {
      const account = getMockAuthenticatedAccount(request);
      if (!account) return new HttpResponse(null, { status: 401 });
      const permitted =
        account.user.globalRole === 'STUDENT' &&
        getMockMySections(account.credentials.studentNumber, {
          status: 'ACTIVE',
        }).some(
          section =>
            String(section.id) === params.sectionId &&
            studentMilestoneFixtures(section.id).some(
              milestone => String(milestone.id) === params.milestoneId,
            ),
        );
      return permitted
        ? HttpResponse.json({
            contents: artifactRules(Number(params.milestoneId)),
          })
        : new HttpResponse(null, { status: 403 });
    },
  ),
  http.post(
    `${API_BASE_URL}/submissions/:submissionId/versions`,
    async ({ request, params }) => {
      if (!/^\d+$/.test(String(params.submissionId))) return;
      const submission = ownSubmission(request, String(params.submissionId));
      if (submission instanceof Response) return submission;
      const account = getMockAuthenticatedAccount(request)!;
      const milestone = getMockMySections(account.credentials.studentNumber, {
        status: 'ACTIVE',
      })
        .flatMap(section => studentMilestoneFixtures(section.id))
        .find(item => item.id === submission.milestoneId)!;
      if (
        !submission.canSubmitNow ||
        (milestone.type === 'FINAL_REPORT' &&
          !account.user.currentTeam?.members.find(
            member => member.id === account.user.id,
          )?.isLeader)
      )
        return HttpResponse.json(
          { message: '제출 권한 또는 기간을 확인해 주세요.' },
          { status: 403 },
        );
      const invalid = () =>
        HttpResponse.json(
          {
            code: 'SUBMISSION_REQUIRED_ARTIFACT_MISMATCH',
            message: '이 마일스톤의 필수 산출물 구성과 맞지 않습니다.',
          },
          { status: 400 },
        );
      const url = new URL(request.url);
      if (!url.searchParams.has('description')) return invalid();
      let form: FormData;
      try {
        form = await request.formData();
      } catch {
        return invalid();
      }
      const ids = url.searchParams.getAll('fileArtifactIds').map(Number);
      const files = form.getAll('files');
      if (ids.length !== files.length) return invalid();
      const rules = artifactRules(milestone.id);
      const artifacts: StudentSubmissionArtifact[] = [];
      for (let index = 0; index < files.length; index++) {
        const file = files[index];
        const rule = rules.find(
          item => item.id === ids[index] && item.type === 'FILE',
        );
        if (
          !file ||
          typeof file === 'string' ||
          !rule ||
          !file.size ||
          file.size > rule.maxFileSizeMb! * 1024 * 1024 ||
          !rule.allowedExtensions.includes(
            file.name.split('.').pop()!.toLowerCase(),
          )
        )
          return invalid();
        artifacts.push({
          type: 'FILE',
          requiredArtifactId: rule.id,
          fileId: submission.id * 10 + submission.currentVersion + 1,
          fileName: file.name,
          size: file.size,
          mimeType: file.type,
          downloadUrl: `https://files.example.test/submissions/${submission.id}-${submission.currentVersion + 1}.pdf`,
        });
      }
      const part = form.get('artifacts');
      if (part) {
        try {
          const parsed: StudentSubmissionArtifact[] = JSON.parse(
            typeof part === 'string' ? part : await part.text(),
          );
          if (
            !Array.isArray(parsed) ||
            parsed.some(
              item =>
                !item ||
                item.type !== 'LINK' ||
                !item.url?.trim() ||
                !rules.some(
                  rule =>
                    rule.id === item.requiredArtifactId &&
                    rule.type === item.type,
                ),
            )
          )
            return invalid();
          artifacts.push(...parsed);
        } catch {
          return invalid();
        }
      }
      if (
        rules.some(
          rule =>
            rule.required &&
            !artifacts.some(item => item.requiredArtifactId === rule.id),
        )
      )
        return invalid();
      const next = {
        ...submission,
        currentVersion: submission.currentVersion + 1,
        status: 'SUBMITTED' as const,
      };
      if (milestone.type === 'FINAL_REPORT') {
        setSubmissionConsent(
          next.id,
          account.user.studentNumber,
          next.currentVersion,
        );
        next.memberConsent = submissionConsentFor(
          next,
          milestone.sectionId,
          account.user.studentNumber,
        );
      }
      const timestamp = new Date().toISOString();
      storeStudentSubmission(next, [
        ...studentSubmissionVersionFixtures(submission),
        {
          id: next.id * 10 + next.currentVersion,
          version: next.currentVersion,
          description: url.searchParams.get('description'),
          changeNote: url.searchParams.get('changeNote'),
          submittedBy: {
            userId: account.credentials.studentNumber,
            name: account.user.name,
          },
          submittedAt: timestamp,
          updatedAt: timestamp,
          late: false,
          artifacts,
        },
      ]);
      return HttpResponse.json(next);
    },
  ),
  http.get(
    `${API_BASE_URL}${ENDPOINTS.SUBMISSION.DETAIL(':submissionId')}`,
    ({ request, params }) => {
      // Legacy demo editor paths have string IDs and keep their existing handlers.
      if (!/^\d+$/.test(String(params.submissionId))) return;
      const submission = ownSubmission(request, String(params.submissionId));
      return submission instanceof Response
        ? submission
        : HttpResponse.json(submission);
    },
  ),
  http.get(
    `${API_BASE_URL}${ENDPOINTS.SUBMISSION.VERSIONS(':submissionId')}`,
    ({ request, params }) => {
      if (!/^\d+$/.test(String(params.submissionId))) return;
      const submission = ownSubmission(request, String(params.submissionId));
      return submission instanceof Response
        ? submission
        : HttpResponse.json({ contents: freshVersions(submission) });
    },
  ),
  http.get(
    `${API_BASE_URL}/submissions/:submissionId/versions/:version`,
    ({ request, params }) => {
      const submission = ownSubmission(request, String(params.submissionId));
      if (submission instanceof Response) return submission;
      const number = Number(params.version);
      if (!Number.isSafeInteger(number) || number <= 0)
        return new HttpResponse(null, { status: 400 });
      const version = freshVersions(submission).find(
        item => item.version === number,
      );
      return version
        ? HttpResponse.json(version)
        : new HttpResponse(null, { status: 404 });
    },
  ),
  http.get(
    'https://files.example.test/submissions/:file',
    () =>
      new HttpResponse(submissionPreviewPdf(), {
        headers: { 'Content-Type': 'application/pdf' },
      }),
  ),
];
