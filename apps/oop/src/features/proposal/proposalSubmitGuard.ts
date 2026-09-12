import type {
  ProjectProposalResponse,
  ProposalSectionType,
  ProposalSectionsResponse,
} from '@aics/core';

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
    return `${blanks.join(', ')}를 채워야 제출할 수 있어요. 주제 영역에서 입력해 주세요.`;
  const incomplete = sections.contents
    .filter(section => !section.completed)
    .map(section => SECTION_LABELS[section.section]);
  if (incomplete.length)
    return `${incomplete.join(', ')} 영역을 작성 완료해야 제출할 수 있어요.`;
  return null;
}
