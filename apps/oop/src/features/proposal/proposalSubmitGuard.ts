import type {
  ProjectProposalResponse,
  ProposalSectionType,
  ProposalSectionsResponse,
} from '@aics/core';
import { isAxiosError } from 'axios';

const SECTION_LABELS: Record<ProposalSectionType, string> = {
  TOPIC: '주제',
  DATA: '데이터 구성',
  SCREEN: '화면 구성',
  TEAM_OPERATION: '팀 운영 방식',
};

/** The server rejects a blank title/description/goal, so name the gap before asking it. */
export function proposalSubmitBlocker(
  project: Pick<ProjectProposalResponse, 'title' | 'description' | 'goal'>,
  sections: ProposalSectionsResponse,
): string | null {
  const blanks = (
    [
      ['프로젝트 제목', project.title],
      ['프로젝트 설명', project.description],
      ['프로젝트 목표', project.goal],
    ] as const
  ).flatMap(([label, value]) => (value?.trim() ? [] : [label]));
  if (blanks.length)
    return `${blanks.join(', ')}을 채워야 제출할 수 있어요. 주제 영역에서 입력해 주세요.`;
  const incomplete = sections.contents
    .filter(section => !section.completed)
    .map(section => SECTION_LABELS[section.section]);
  if (incomplete.length)
    return `${incomplete.join(', ')} 영역을 작성 완료해야 제출할 수 있어요.`;
  return null;
}

export function proposalRequestErrorMessage(error: unknown) {
  if (error instanceof Error && !isAxiosError(error)) return error.message;
  if (!isAxiosError<{ code?: string; message?: string }>(error))
    return '요청을 처리하지 못했어요. 입력 내용을 유지한 채 다시 시도해 주세요.';
  const { code, message } = error.response?.data ?? {};
  switch (code) {
    case 'PROPOSAL_SECTION_INCOMPLETE':
      return '작성 완료되지 않은 영역이 있어요. 각 영역을 완료한 뒤 제출해 주세요.';
    case 'PROJECT_PROPOSAL_COMPLETED':
      return '이미 제출된 제안서예요. 최신 내용을 다시 조회해 주세요.';
    case 'ACCESS_DENIED':
      return '이 작업을 수행할 권한이 없어요. 팀장 여부를 확인해 주세요.';
  }
  if (message) return message;
  switch (error.response?.status) {
    case 400:
      return '입력하지 않은 필수 항목이 있어요. 제목·설명·목표와 각 영역 입력을 확인해 주세요.';
    case 401:
      return '로그인 상태를 확인한 뒤 다시 시도해 주세요.';
    case 403:
      return '이 작업을 수행할 권한이 없어요. 팀장 여부를 확인해 주세요.';
    case 409:
      return '다른 변경이 먼저 저장됐어요. 최신 내용을 확인한 뒤 다시 시도해 주세요.';
    case 500:
      return '서버가 요청을 처리하지 못했어요. 빈 입력이 없는지 확인한 뒤 다시 시도해 주세요.';
  }
  return '요청을 처리하지 못했어요. 입력 내용을 유지한 채 다시 시도해 주세요.';
}
