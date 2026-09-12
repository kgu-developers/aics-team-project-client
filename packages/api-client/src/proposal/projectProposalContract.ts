import {
  PROPOSAL_SECTIONS,
  type ProjectImageUploadResponse,
  type ProjectProposalResponse,
  type ProposalSectionsResponse,
  type ProposalSectionResponse,
} from '@aics/core';

export function assertProposalId(id: string | number) {
  if (!/^[1-9]\d*$/.test(String(id)) || !Number.isSafeInteger(Number(id)))
    throw new Error('유효한 팀 또는 프로젝트 ID가 필요합니다.');
}
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function nullableString(value: unknown) {
  return value == null || typeof value === 'string';
}
export function parseProjectProposal(
  value: unknown,
  teamId: string,
): ProjectProposalResponse {
  if (
    !record(value) ||
    !Number.isSafeInteger(value.id) ||
    Number(value.id) <= 0 ||
    String(value.teamId) !== teamId ||
    !['title', 'description', 'goal'].every(
      key => typeof value[key] === 'string',
    ) ||
    !['projectSchedule', 'repositoryUrl', 'proposalCompletedAt'].every(key =>
      nullableString(value[key]),
    ) ||
    !Array.isArray(value.dataConfiguration) ||
    !value.dataConfiguration.every(
      row =>
        record(row) &&
        ['name', 'description', 'expectedCount'].every(key =>
          nullableString(row[key]),
        ),
    ) ||
    !Array.isArray(value.screenConfiguration) ||
    !value.screenConfiguration.every(
      row =>
        record(row) &&
        ['title', 'description', 'imageUrl'].every(key =>
          nullableString(row[key]),
        ) &&
        (row.imageFileId == null ||
          (Number.isSafeInteger(row.imageFileId) &&
            Number(row.imageFileId) > 0)),
    ) ||
    !record(value.teamOperation) ||
    String(value.teamOperation.id) !== teamId ||
    typeof value.teamOperation.name !== 'string' ||
    !['kickoffRule', 'meetingSchedule'].every(key =>
      nullableString((value.teamOperation as Record<string, unknown>)[key]),
    ) ||
    !Array.isArray(value.teamOperation.members) ||
    !value.teamOperation.members.every(
      member =>
        record(member) &&
        Number.isSafeInteger(member.id) &&
        typeof member.studentNumber === 'string' &&
        typeof member.isLeader === 'boolean' &&
        nullableString(member.name) &&
        nullableString(member.projectRole),
    )
  )
    throw new Error(
      '제안서 응답 형식을 확인할 수 없습니다. 입력 내용을 덮어쓰지 않고 다시 시도해 주세요.',
    );
  return value as ProjectProposalResponse;
}
export function parseProjectImageUpload(
  value: unknown,
): ProjectImageUploadResponse {
  if (
    !record(value) ||
    !Number.isSafeInteger(value.fileId) ||
    Number(value.fileId) <= 0
  )
    throw new Error('이미지 업로드 응답을 확인할 수 없습니다.');
  return value as ProjectImageUploadResponse;
}
export function parseProposalSection(value: unknown): ProposalSectionResponse {
  if (
    !record(value) ||
    !PROPOSAL_SECTIONS.includes(value.section as never) ||
    typeof value.completed !== 'boolean' ||
    !['assigneeUserId', 'assigneeName', 'completedAt'].every(key =>
      nullableString(value[key]),
    )
  )
    throw new Error('제안서 작성 상태를 확인할 수 없습니다.');
  return {
    ...value,
    assigneeUserId: value.assigneeUserId ?? null,
    assigneeName: value.assigneeName ?? null,
    completedAt: value.completedAt ?? null,
  } as ProposalSectionResponse;
}
export function parseProposalSections(
  value: unknown,
): ProposalSectionsResponse {
  if (
    !record(value) ||
    !Array.isArray(value.contents) ||
    typeof value.allCompleted !== 'boolean'
  )
    throw new Error('제안서 작성 상태를 확인할 수 없습니다.');
  const contents = value.contents.map(parseProposalSection);
  if (
    contents.length !== 4 ||
    new Set(contents.map(s => s.section)).size !== 4 ||
    value.allCompleted !== contents.every(s => s.completed)
  )
    throw new Error('제안서 영역 상태가 일치하지 않습니다.');
  return { contents, allCompleted: value.allCompleted };
}
