export type MilestoneTemplateId =
  | 'proposal'
  | 'midterm'
  | 'presentation-submit'
  | 'presentation-evaluate'
  | 'final-report'
  | 'peer-review';

export type MilestoneTemplate = {
  description: string;
  fields: readonly string[];
  id: MilestoneTemplateId;
  label: string;
  title: string;
};

export const milestoneTemplates: readonly MilestoneTemplate[] = [
  {
    id: 'proposal',
    label: '제안서',
    title: '제안서',
    description: '프로젝트의 목표와 구성 방식을 정리하는 기본 양식입니다.',
    fields: ['팀 정보', '주제', '데이터 구성', '화면 구성', '팀 운영 방식'],
  },
  {
    id: 'midterm',
    label: '중간 점검',
    title: '중간 점검',
    description: '프로젝트 진행 상황과 설계 내용을 점검하는 기본 양식입니다.',
    fields: [
      '주제',
      '화면 GUI 설계',
      '엔진부 설계',
      '팀프로젝트 진행 계획',
      '중간 점검 질문',
    ],
  },
  {
    id: 'presentation-submit',
    label: '발표 자료 제출',
    title: '발표 자료 제출',
    description:
      '발표에 사용할 프로젝트 설명과 자료를 제출하는 기본 양식입니다.',
    fields: [
      '프로젝트 개요',
      '프레젠테이션 자료',
      '주요 기능',
      '주요 화면',
      '시연 영상',
    ],
  },
  {
    id: 'presentation-evaluate',
    label: '발표 평가',
    title: '발표 평가',
    description: '학생이 다른 팀의 발표를 평가하는 기본 평가 항목입니다.',
    fields: ['프로젝트 완성도', '기능 구성과 구현', '발표 전달력'],
  },
  {
    id: 'final-report',
    label: '최종 보고서',
    title: '최종 보고서',
    description:
      '최종 보고서 PDF와 최종 소스코드 ZIP을 제출하는 기본 양식입니다.',
    fields: ['최종보고서 PDF', '최종 소스코드 ZIP'],
  },
  {
    id: 'peer-review',
    label: '상호 평가',
    title: '상호 평가',
    description: '프로젝트 평가와 팀원 기여도를 제출하는 기본 양식입니다.',
    fields: ['프로젝트 평가', '팀원 기여도 평가'],
  },
];

export function findMilestoneTemplate(templateId: string | undefined) {
  return milestoneTemplates.find(template => template.id === templateId);
}

export function isMilestoneTemplateId(
  value: string | undefined,
): value is MilestoneTemplateId {
  return findMilestoneTemplate(value) !== undefined;
}
