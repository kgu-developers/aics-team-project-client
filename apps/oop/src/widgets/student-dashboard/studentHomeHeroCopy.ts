import type { StudentHomeHero, StudentHomeMilestone } from '@aics/core';

type MilestoneHeroCopy = Pick<StudentHomeHero, 'heading' | 'description'> & {
  task: string;
  actionLabel: string;
};

const milestoneHeroCopy: Record<string, MilestoneHeroCopy> = {
  'proposal:주제 선정': {
    task: '주제를 선정',
    actionLabel: '제안서 주제 선정',
    heading: '아직 주제를 선정하지 않았어요.',
    description: '팀원이 등록한 후보를 확인하고 투표해 주세요.',
  },
  'proposal:제안서 작성': {
    task: '제안서를 작성',
    actionLabel: '제안서 작성',
    heading: '제안서를 작성하고 있어요.',
    description: '작성 영역을 확인하고 제출 기간 안에 제안서를 완성해 주세요.',
  },
  'proposal:피드백 반영': {
    task: '제안서를 보완',
    actionLabel: '제안서 피드백 반영',
    heading: '제안서 피드백을 반영해 주세요.',
    description:
      '교수 피드백을 확인한 뒤 수정 기간 안에 제안서를 다시 제출할 수 있어요.',
  },
  'mid-review:중간보고서 작성': {
    task: '중간보고서를 작성',
    actionLabel: '중간보고서 작성',
    heading: '중간보고서를 작성하고 있어요.',
    description: '제출 기한과 작성 영역을 확인해 중간보고서를 진행해 주세요.',
  },
  'mid-review:피드백 반영': {
    task: '중간보고서 피드백을 반영',
    actionLabel: '중간보고서 피드백 반영',
    heading: '중간보고서 피드백을 반영해 주세요.',
    description: '피드백 반영 내용과 변경 사항을 확인해 주세요.',
  },
  'presentation:발표 자료 작성': {
    task: '발표 자료를 작성',
    actionLabel: '발표 자료 작성',
    heading: '발표 자료를 준비하고 있어요.',
    description: '프로젝트 소개와 발표 자료를 작성해 주세요.',
  },
  'presentation:발표 평가': {
    task: '발표 평가를 진행',
    actionLabel: '발표 평가',
    heading: '발표 평가 기간이에요.',
    description: '평가 가능 시간과 팀별 발표 순서를 확인해 주세요.',
  },
  'final-report:최종보고서 제출': {
    task: '최종보고서를 제출',
    actionLabel: '최종보고서 제출',
    heading: '최종보고서를 제출해 주세요.',
    description: '최종보고서와 필수 소스코드 파일을 확인해 주세요.',
  },
  'peer-evaluation:상호 평가': {
    task: '상호 평가를 작성',
    actionLabel: '상호 평가 작성',
    heading: '상호 평가를 진행해 주세요.',
    description: '팀원별 평가 항목을 확인하고 기간 안에 제출해 주세요.',
  },
};

function getMilestoneHeroCopy(milestone: StudentHomeMilestone) {
  return milestoneHeroCopy[
    `${milestone.id}:${milestone.currentStepLabel ?? ''}`
  ];
}

function hasFinalConsonant(value: string) {
  const finalCode = value.charCodeAt(value.length - 1);
  return (
    finalCode >= 0xac00 &&
    finalCode <= 0xd7a3 &&
    (finalCode - 0xac00) % 28 !== 0
  );
}

function withObjectParticle(value: string) {
  return `${value}${hasFinalConsonant(value) ? '을' : '를'}`;
}

function joinWithAnd(values: string[]) {
  return values.reduce(
    (text, value) =>
      text ? `${text}${hasFinalConsonant(text) ? '과' : '와'} ${value}` : value,
    '',
  );
}

export function getStudentHomeHeroCopy(
  fallbackHero: StudentHomeHero,
  milestones: StudentHomeMilestone[],
): StudentHomeHero {
  const activeCopies = milestones
    .filter(milestone => milestone.isDetailAvailable)
    .map(getMilestoneHeroCopy)
    .filter((copy): copy is MilestoneHeroCopy => Boolean(copy));

  if (activeCopies.length === 0) return fallbackHero;

  if (activeCopies.length === 1) {
    const [copy] = activeCopies;
    if (!copy) return fallbackHero;
    return {
      ...fallbackHero,
      heading: copy.heading,
      description: copy.description,
      ctaLabel: copy.actionLabel,
    };
  }

  return {
    ...fallbackHero,
    heading: `${activeCopies.map(copy => copy.task).join('하고, ')}하고 있어요.`,
    description: `${withObjectParticle(joinWithAnd(activeCopies.map(copy => copy.actionLabel)))} 함께 진행해 주세요.`,
    ctaLabel: '진행 단계 확인',
  };
}
