import type {
  ProjectProposalResponse,
  ProposalSectionType,
  UpdateProjectProposalInput,
} from '@aics/core';

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
export function mergeProposalSection(
  latest: ProjectProposalResponse,
  baseline: ProjectProposalResponse,
  draft: UpdateProjectProposalInput,
  section: ProposalSectionType,
): UpdateProjectProposalInput {
  if (latest.id !== baseline.id || latest.proposalCompletedAt)
    throw new Error(
      '제안서가 변경되었거나 이미 제출되었습니다. 입력 내용을 보관하고 다시 조회해 주세요.',
    );
  const current = proposalDraft(latest);
  if (
    !sameProposalSection(current, proposalDraft(baseline), section) &&
    !sameProposalSection(current, draft, section)
  )
    throw new Error(
      '다른 편집 내용이 저장되어 있습니다. 입력 내용은 유지됩니다. 최신 내용을 확인한 뒤 다시 편집해 주세요.',
    );
  // Only the selected section is overlaid. In particular, kickoff values are omitted
  // outside TEAM_OPERATION so a topic save cannot rewrite teammates' roles.
  const body = { ...current };
  delete body.kickoffRule;
  delete body.meetingSchedule;
  delete body.memberRoles;
  const merged = { ...body, ...proposalSectionFields(draft, section) };
  if (!merged.title.trim() || !merged.description.trim() || !merged.goal.trim())
    throw new Error('주제의 제목, 설명, 목표를 모두 입력해 주세요.');
  if (merged.title.length > 200)
    throw new Error('프로젝트 제목은 200자 이내로 입력해 주세요.');
  if (
    merged.memberRoles?.some(member => (member.projectRole?.length ?? 0) > 50)
  )
    throw new Error('역할은 50자 이내로 입력해 주세요.');
  return merged;
}
