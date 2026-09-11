import { API_BASE_URL } from '@aics/api-client';
import {
  PROPOSAL_SECTIONS,
  type ProjectProposalResponse,
  type ProposalSectionsResponse,
  type UpdateProjectProposalInput,
} from '@aics/core';
import { http, HttpResponse } from 'msw';

import { getMockAccessToken } from '../authSession';
import {
  createProjectProposalFixture,
  createProposalSectionsFixture,
} from '../data/projectProposal';
import { getDemoUserAccount } from '../data/users';
/** Real Project contract, opt-in alongside the real account-lock handlers. */
export function createProjectProposalHandlers(
  options: {
    project?: ProjectProposalResponse;
    sections?: ProposalSectionsResponse;
  } = {},
) {
  let project = structuredClone(
    options.project ?? createProjectProposalFixture(),
  );
  const sections = structuredClone(
    options.sections ?? createProposalSectionsFixture(),
  );
  const failure = (code: string, status: number) =>
    HttpResponse.json({ code }, { status });
  function access(request: Request) {
    const account = getDemoUserAccount(getMockAccessToken(request));
    if (!account) return failure('UNAUTHORIZED', 401);
    if (
      !project.teamOperation.members.some(
        m => m.studentNumber === account.user.studentNumber,
      )
    )
      return failure('ACCESS_DENIED', 403);
    return null;
  }
  const sectionList = () => ({
    ...sections,
    allCompleted: sections.contents.every(s => s.completed),
  });
  const base = `${API_BASE_URL}/api/v1`;
  return [
    http.get(
      `${base}/teams/:teamId/project`,
      ({ request, params }) =>
        access(request) ??
        (String(project.teamId) !== params.teamId
          ? failure('PROJECT_NOT_FOUND', 404)
          : HttpResponse.json(project)),
    ),
    http.put(`${base}/teams/:teamId/project`, async ({ request, params }) => {
      const denied = access(request);
      if (denied) return denied;
      if (String(project.teamId) !== params.teamId)
        return failure('PROJECT_NOT_FOUND', 404);
      if (project.proposalCompletedAt)
        return failure('PROJECT_PROPOSAL_COMPLETED', 409);
      const body = (await request.json()) as UpdateProjectProposalInput;
      if (
        !body.title?.trim() ||
        body.title.length > 200 ||
        !body.description?.trim() ||
        !body.goal?.trim() ||
        !Array.isArray(body.dataConfiguration) ||
        !Array.isArray(body.screenConfiguration)
      )
        return failure('INVALID_INPUT', 400);
      const changed = new Set<string>();
      if (
        ['title', 'description', 'goal'].some(
          k => project[k as 'title'] !== body[k as 'title'],
        )
      )
        changed.add('TOPIC');
      if (
        JSON.stringify(project.dataConfiguration) !==
        JSON.stringify(body.dataConfiguration)
      )
        changed.add('DATA');
      if (
        JSON.stringify(project.screenConfiguration) !==
        JSON.stringify(body.screenConfiguration)
      )
        changed.add('SCREEN');
      if (
        project.projectSchedule !== body.projectSchedule ||
        (body.kickoffRule != null &&
          body.kickoffRule !== project.teamOperation.kickoffRule) ||
        (body.meetingSchedule != null &&
          body.meetingSchedule !== project.teamOperation.meetingSchedule) ||
        body.memberRoles?.some(
          r =>
            project.teamOperation.members.find(
              m => m.studentNumber === r.studentNumber,
            )?.projectRole !== r.projectRole,
        )
      )
        changed.add('TEAM_OPERATION');
      const { kickoffRule, meetingSchedule, memberRoles, ...content } = body;
      project = {
        ...project,
        ...content,
        screenConfiguration: body.screenConfiguration.map(screen => {
          const stored = { ...screen };
          delete stored.imageUrl;
          return stored;
        }),
        teamOperation: {
          ...project.teamOperation,
          kickoffRule: kickoffRule ?? project.teamOperation.kickoffRule,
          meetingSchedule:
            meetingSchedule ?? project.teamOperation.meetingSchedule,
          members: project.teamOperation.members.map(m => ({
            ...m,
            projectRole:
              memberRoles?.find(r => r.studentNumber === m.studentNumber)
                ?.projectRole ?? m.projectRole,
          })),
        },
      };
      sections.contents.forEach(s => {
        if (changed.has(s.section)) {
          s.completed = false;
          s.completedAt = null;
        }
      });
      return HttpResponse.json(project);
    }),
    http.get(
      `${base}/projects/:projectId/proposal/sections`,
      ({ request, params }) =>
        access(request) ??
        (String(project.id) !== params.projectId
          ? failure('PROJECT_NOT_FOUND', 404)
          : HttpResponse.json(sectionList())),
    ),
    http.put(
      `${base}/projects/:projectId/proposal/sections/:section`,
      async ({ request, params }) => {
        const denied = access(request);
        if (denied) return denied;
        if (String(project.id) !== params.projectId)
          return failure('PROJECT_NOT_FOUND', 404);
        if (project.proposalCompletedAt)
          return failure('PROJECT_PROPOSAL_COMPLETED', 409);
        const body = (await request.json()) as {
          completed: boolean;
          assigneeUserId?: string | null;
        };
        if (
          !PROPOSAL_SECTIONS.includes(params.section as never) ||
          typeof body.completed !== 'boolean'
        )
          return failure('INVALID_INPUT', 400);
        const member = project.teamOperation.members.find(
          m => m.studentNumber === body.assigneeUserId,
        );
        if (body.assigneeUserId && !member)
          return failure('PROPOSAL_SECTION_ASSIGNEE_NOT_MEMBER', 400);
        const s = sections.contents.find(s => s.section === params.section)!;
        Object.assign(s, {
          assigneeUserId: body.assigneeUserId ?? null,
          assigneeName: member?.name ?? null,
          completed: body.completed,
          completedAt: body.completed ? new Date().toISOString() : null,
        });
        return HttpResponse.json(s);
      },
    ),
    http.patch(
      `${base}/projects/:projectId/proposal-complete`,
      ({ request, params }) => {
        const denied = access(request);
        if (denied) return denied;
        if (String(project.id) !== params.projectId)
          return failure('PROJECT_NOT_FOUND', 404);
        const account = getDemoUserAccount(getMockAccessToken(request))!;
        if (
          !project.teamOperation.members.some(
            m => m.studentNumber === account.user.studentNumber && m.isLeader,
          )
        )
          return failure('ACCESS_DENIED', 403);
        if (project.proposalCompletedAt)
          return failure('PROJECT_PROPOSAL_COMPLETED', 409);
        if (!sectionList().allCompleted)
          return failure('PROPOSAL_SECTION_INCOMPLETE', 409);
        project.proposalCompletedAt = new Date().toISOString();
        return new HttpResponse(null, { status: 200 });
      },
    ),
  ];
}
