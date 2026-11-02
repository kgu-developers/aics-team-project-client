import { API_BASE_URL } from '@aics/api-client';
import {
  PROPOSAL_SECTIONS,
  type ProjectProposalResponse,
  type ProposalSectionsResponse,
  type SaveProposalSectionInput,
  type LiveEditLockTarget,
  type LiveEditLockStatus,
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
    lockStatus?: (target: LiveEditLockTarget) => LiveEditLockStatus;
  } = {},
) {
  const project = structuredClone(
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
  /**
   * The browser worker parses multipart normally. Under jsdom the File instance
   * is not the one Node's multipart parser accepts, so fall back to the raw part.
   */
  async function readFilePart(request: Request) {
    const raw = request.clone();
    try {
      const file = (await request.formData()).get('file');
      // jsdom's File is from a different realm than the Node/MSW global File.
      // Validate the multipart value by its contract instead of `instanceof`.
      return file && typeof file !== 'string' && typeof file.type === 'string'
        ? { type: file.type }
        : null;
    } catch {
      const match =
        /name="file";\s*filename="[^"]*"\r?\nContent-Type:\s*([^\r\n]+)/i.exec(
          await raw.text(),
        );
      return match?.[1] ? { type: match[1].trim() } : null;
    }
  }
  const uploadedImages = new Map<number, string>();
  let nextImageFileId = 900;
  /** The server enriches saved imageFileId values with a temporary URL on read. */
  const withImageUrls = (value: ProjectProposalResponse) => ({
    ...value,
    screenConfiguration: value.screenConfiguration.map(screen => {
      const url =
        screen.imageFileId == null
          ? undefined
          : uploadedImages.get(screen.imageFileId);
      return url ? { ...screen, imageUrl: url } : screen;
    }),
  });
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
          : HttpResponse.json(withImageUrls(project))),
    ),
    http.post(
      `${base}/teams/:teamId/project/images/upload`,
      async ({ request, params }) => {
        const denied = access(request);
        if (denied) return denied;
        if (String(project.teamId) !== params.teamId)
          return failure('PROJECT_NOT_FOUND', 404);
        const file = await readFilePart(request);
        if (!file?.type.startsWith('image/'))
          return failure('INVALID_INPUT', 400);
        const fileId = nextImageFileId++;
        uploadedImages.set(
          fileId,
          `https://files.invalid/project-images/${fileId}`,
        );
        return HttpResponse.json({ fileId });
      },
    ),
    http.put(`${base}/teams/:teamId/project`, async ({ request, params }) => {
      const denied = access(request);
      if (denied) return denied;
      if (String(project.teamId) !== params.teamId)
        return failure('PROJECT_NOT_FOUND', 404);
      if (project.proposalCompletedAt)
        return failure('PROJECT_PROPOSAL_COMPLETED', 403);
      const body = (await request.json()) as SaveProposalSectionInput;
      if (
        !PROPOSAL_SECTIONS.includes(body.sectionKey) ||
        !Number.isSafeInteger(body.sectionVersion) ||
        body.sectionVersion < 0
      )
        return failure('INVALID_INPUT', 400);
      if (body.sectionVersion !== project.sectionVersions[body.sectionKey])
        return failure('PROJECT_VERSION_CONFLICT', 409);
      const owner = getDemoUserAccount(getMockAccessToken(request))!.user
        .studentNumber;
      const lock = options.lockStatus?.({
        targetType: 'PROJECT',
        targetId: project.id,
        sectionKey: body.sectionKey,
      });
      if (!lock?.locked || lock.lockedBy !== owner)
        return failure('EDIT_LOCK_CONFLICT', 409);
      const before = JSON.stringify(project);
      switch (body.sectionKey) {
        case 'TOPIC':
          if (
            !body.title?.trim() ||
            body.title.length > 200 ||
            !body.description?.trim() ||
            !body.goal?.trim() ||
            (body.repositoryUrl?.length ?? 0) > 255
          )
            return failure('INVALID_INPUT', 400);
          Object.assign(project, {
            title: body.title,
            description: body.description,
            goal: body.goal,
            repositoryUrl: body.repositoryUrl ?? null,
            externalLinks: body.externalLinks ?? null,
          });
          break;
        case 'DATA':
          if (!Array.isArray(body.dataConfiguration))
            return failure('INVALID_INPUT', 400);
          project.dataConfiguration = body.dataConfiguration;
          break;
        case 'SCREEN':
          if (!Array.isArray(body.screenConfiguration))
            return failure('INVALID_INPUT', 400);
          project.screenConfiguration = body.screenConfiguration.map(screen => {
            const stored = { ...screen };
            delete stored.imageUrl;
            return stored;
          });
          break;
        case 'TEAM_OPERATION':
          if (
            body.memberRoles?.some(
              member => (member.projectRole?.length ?? 0) > 50,
            )
          )
            return failure('INVALID_INPUT', 400);
          project.projectSchedule =
            body.projectSchedule ?? project.projectSchedule;
          project.teamOperation.kickoffRule =
            body.kickoffRule ?? project.teamOperation.kickoffRule;
          project.teamOperation.meetingSchedule =
            body.meetingSchedule ?? project.teamOperation.meetingSchedule;
          project.teamOperation.members = project.teamOperation.members.map(
            member => {
              const role = body.memberRoles?.find(
                r => r.studentNumber === member.studentNumber,
              );
              return role
                ? { ...member, projectRole: role.projectRole }
                : member;
            },
          );
          break;
      }
      if (before !== JSON.stringify(project)) {
        project.sectionVersions[body.sectionKey] += 1;
        const section = sections.contents.find(
          s => s.section === body.sectionKey,
        )!;
        section.completed = false;
        section.completedAt = null;
      }
      return HttpResponse.json(withImageUrls(project));
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
          return failure('PROJECT_PROPOSAL_COMPLETED', 403);
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
          return failure('PROJECT_PROPOSAL_COMPLETED', 403);
        if (!sectionList().allCompleted)
          return failure('PROPOSAL_SECTION_INCOMPLETE', 409);
        project.proposalCompletedAt = new Date().toISOString();
        return new HttpResponse(null, { status: 200 });
      },
    ),
  ];
}
