import type {
  ProjectProposalResponse,
  SaveProposalSectionInput,
  ProposalSectionType,
  UpdateProjectProposalInput,
} from '@aics/core';

import { DocumentRequestError } from '~/features/editor/documentRequestErrorMessage';

export const proposalSectionBySlug: Record<
  string,
  ProposalSectionType | undefined
> = {
  topic: 'TOPIC',
  'data-composition': 'DATA',
  'screen-composition': 'SCREEN',
  'team-operations': 'TEAM_OPERATION',
};
export function proposalDraft(
  project: ProjectProposalResponse,
): UpdateProjectProposalInput {
  return structuredClone({
    title: project.title,
    description: project.description,
    goal: project.goal,
    dataConfiguration: project.dataConfiguration,
    screenConfiguration: project.screenConfiguration.map(row => {
      const stored = { ...row };
      delete stored.imageUrl;
      return stored;
    }),
    projectSchedule: project.projectSchedule ?? '',
    repositoryUrl: project.repositoryUrl ?? '',
    externalLinks: project.externalLinks,
    kickoffRule: project.teamOperation.kickoffRule ?? '',
    meetingSchedule: project.teamOperation.meetingSchedule ?? '',
    memberRoles: project.teamOperation.members.map(m => ({
      studentNumber: m.studentNumber,
      projectRole: m.projectRole ?? '',
    })),
  });
}
export function proposalSectionFields(
  draft: UpdateProjectProposalInput,
  section: ProposalSectionType,
) {
  switch (section) {
    case 'TOPIC':
      return {
        title: draft.title,
        description: draft.description,
        goal: draft.goal,
        repositoryUrl: draft.repositoryUrl,
        externalLinks: draft.externalLinks,
      };
    case 'DATA':
      return { dataConfiguration: draft.dataConfiguration };
    case 'SCREEN':
      return { screenConfiguration: draft.screenConfiguration };
    case 'TEAM_OPERATION':
      return {
        projectSchedule: draft.projectSchedule,
        kickoffRule: draft.kickoffRule,
        meetingSchedule: draft.meetingSchedule,
        memberRoles: draft.memberRoles,
      };
  }
}
function stable(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(stable).join(',') + ']';
  if (value && typeof value === 'object')
    return (
      '{' +
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => JSON.stringify(k) + ':' + stable(v))
        .join(',') +
      '}'
    );
  return JSON.stringify(value) ?? 'undefined';
}
export function sameProposalSection(
  a: UpdateProjectProposalInput,
  b: UpdateProjectProposalInput,
  section: ProposalSectionType,
) {
  return (
    stable(proposalSectionFields(a, section)) ===
    stable(proposalSectionFields(b, section))
  );
}
/**
 * 팀 운영 방식의 팀 규칙·회의 방식·역할 분담은 킥오프 저장소에 그대로 쓰인다. 서버는 넘기지 않은
 * 항목은 현재 값을 유지하고, 값이 실제로 바뀐 경우에만 제안서 리비전을 올리며 이 영역의 작성 완료를
 * 해제한다. 그래서 바뀐 항목만 담아 보낸다. 서버의 null과 화면의 빈 문자열은 같은 "미입력"이므로
 * 정규화한 값끼리 비교한다.
 */
function pruneUnchangedKickoff(
  body: Pick<
    UpdateProjectProposalInput,
    'kickoffRule' | 'meetingSchedule' | 'memberRoles'
  >,
  latest: UpdateProjectProposalInput,
) {
  if (body.kickoffRule === latest.kickoffRule) delete body.kickoffRule;
  if (body.meetingSchedule === latest.meetingSchedule)
    delete body.meetingSchedule;
  const changedRoles = (body.memberRoles ?? []).filter(
    role =>
      latest.memberRoles?.find(
        member => member.studentNumber === role.studentNumber,
      )?.projectRole !== role.projectRole,
  );
  if (changedRoles.length) body.memberRoles = changedRoles;
  else delete body.memberRoles;
}

export function mergeProposalSection(
  latest: ProjectProposalResponse,
  baseline: ProjectProposalResponse,
  draft: UpdateProjectProposalInput,
  section: ProposalSectionType,
): SaveProposalSectionInput | null {
  if (latest.id !== baseline.id || latest.proposalCompletedAt)
    throw new Error(
      '제안서가 변경되었거나 이미 제출되었습니다. 입력 내용을 보관하고 다시 조회해 주세요.',
    );
  const current = proposalDraft(latest);
  // A lost response may leave the draft already persisted at a newer version.
  // Adopt that document instead of sending another PUT with the old version.
  if (
    latest.sectionVersions[section] > baseline.sectionVersions[section] &&
    sameProposalSection(current, draft, section)
  )
    return null;
  if (
    !sameProposalSection(current, proposalDraft(baseline), section) &&
    !sameProposalSection(current, draft, section)
  )
    throw new DocumentRequestError(
      '다른 편집 내용이 저장되어 있습니다. 입력 내용은 유지됩니다. 최신 내용을 확인한 뒤 다시 편집해 주세요.',
      'replace-content',
    );
  return createProposalSectionInput(baseline, draft, section);
}

export function createProposalSectionInput(
  baseline: ProjectProposalResponse,
  draft: UpdateProjectProposalInput,
  section: ProposalSectionType,
): SaveProposalSectionInput {
  const sectionVersion = baseline.sectionVersions[section];
  switch (section) {
    case 'TOPIC':
      if (
        !draft.title.trim() ||
        !draft.description.trim() ||
        !draft.goal.trim()
      )
        throw new Error('주제의 제목, 설명, 목표를 모두 입력해 주세요.');
      if (draft.title.length > 200 || (draft.repositoryUrl?.length ?? 0) > 255)
        throw new Error(
          '제목은 200자, 저장소 URL은 255자 이내로 입력해 주세요.',
        );
      return {
        sectionKey: section,
        sectionVersion,
        title: draft.title,
        description: draft.description,
        goal: draft.goal,
        repositoryUrl: draft.repositoryUrl,
        externalLinks: draft.externalLinks,
      };
    case 'DATA':
      return {
        sectionKey: section,
        sectionVersion,
        dataConfiguration: draft.dataConfiguration,
      };
    case 'SCREEN':
      return {
        sectionKey: section,
        sectionVersion,
        screenConfiguration: draft.screenConfiguration,
      };
    case 'TEAM_OPERATION': {
      if (
        draft.memberRoles?.some(
          member => (member.projectRole?.length ?? 0) > 50,
        )
      )
        throw new Error('역할은 50자 이내로 입력해 주세요.');
      const body = {
        sectionKey: section,
        sectionVersion,
        projectSchedule: draft.projectSchedule,
        kickoffRule: draft.kickoffRule,
        meetingSchedule: draft.meetingSchedule,
        memberRoles: draft.memberRoles,
      };
      pruneUnchangedKickoff(body, proposalDraft(baseline));
      return body;
    }
  }
}
