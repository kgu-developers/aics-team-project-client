import type { AdminMilestoneSubmissionDetailResponse } from '@aics/api-client';

import { getAdminSubmissionFiles } from './adminSubmissionFiles';
import { adminStudentsFixture, adminTeamsFixture } from './adminStudentTeams';

const teamOneFiles = getAdminSubmissionFiles('team-1151-1');
const teamTwoFiles = getAdminSubmissionFiles('team-1151-2');

const proposalSubmissionDetail: AdminMilestoneSubmissionDetailResponse = {
  milestone: {
    id: 'proposal',
    title: '제안서',
  },
  midterm: null,
  presentation: null,
  proposal: {
    collaboration: '주 2회 대면 회의, GitHub PR 리뷰 후 병합',
    dataRows: [
      {
        count: 20,
        description: '상영 가능한 영화 기본 정보',
        name: '영화',
      },
      {
        count: 120,
        description: '영화별 상영관과 시간표',
        name: '상영 일정',
      },
      {
        count: 200,
        description: '좌석별 예매 기록',
        name: '예매',
      },
    ],
    introduction: '영화 데이터를 다루는 웹 서비스로 함께 성장하는 팀입니다.',
    members: ['이서연', '김민준'],
    projectDescription:
      '팀 프로젝트의 진행 상황과 제출물을 한곳에서 관리합니다.',
    projectTitle: 'AI 기반 팀 프로젝트 관리 서비스',
    roles: '김민준: ENGINE · 이서연: GUI',
    schedule: '9월 도메인 설계 → 10월 중간보고서 → 11월 발표·최종 제출',
    screenDescription:
      '관리자는 팀과 분반의 프로젝트 진행 현황을 확인하고, 필요한 피드백을 남길 수 있습니다.',
    screens: [
      {
        name: '팀 대시보드',
        description: '팀 진행 현황과 제출 상태를 확인합니다.',
      },
      {
        name: '분반별 제출물',
        description: '마일스톤별 팀 제출물을 확인합니다.',
      },
    ],
    teamLeaderName: '김민준',
    teamName: 'OOP-01 - 1팀',
    wireframeFileNames: ['team-dashboard.png'],
  },
  section: {
    id: 'oop-2026-2-01',
    label: 'OOP-01',
  },
  submittedAt: '2026/09/05',
  submission: {
    id: 'submission-oop-01-1-proposal',
    teamId: 'team-1151-1',
    teamName: 'OOP-01 - 1팀',
  },
};

const midtermSubmissionDetail: AdminMilestoneSubmissionDetailResponse = {
  milestone: {
    id: 'midterm',
    title: '중간 점검',
  },
  midterm: {
    blocks: [
      {
        description: '제안서에서 확정된 주제와 현재 기획 방향을 정리합니다.',
        fields: [
          {
            label: '프로젝트 제목',
            value: 'AI 기반 팀 프로젝트 관리 서비스',
          },
          {
            label: '주제 설명',
            value: '팀 프로젝트의 진행 상황과 제출물을 한곳에서 관리합니다.',
          },
        ],
        title: '1. 주제',
      },
      {
        description: '화면별 이름과 동작 설명을 한 세트씩 등록합니다.',
        fields: [
          {
            label: '화면 GUI 목록',
            value:
              '팀 대시보드: 팀 진행 현황과 제출 상태를 확인합니다.\n분반별 제출물: 마일스톤별 팀 제출물을 확인합니다.',
            attachment: teamOneFiles?.midterm[0],
          },
        ],
        title: '2. 화면 GUI 설계',
      },
      {
        description: '클래스 구조와 기능 로직, 실행 관련 파일을 정리합니다.',
        fields: [
          {
            label: '구현된 기능 목록',
            value: '팀 구성 조회 · 마일스톤 진행 현황 · 제출물 목록',
          },
          {
            label: '클래스 구조와 주요 기능 설명',
            value:
              '분반, 팀, 마일스톤, 제출물의 조회 책임을 나누어 관리합니다.',
          },
          {
            label: '입력·출력 테스트 케이스',
            value:
              '담당 분반의 팀 제출물 목록을 조회하고 상세 화면으로 이동합니다.',
          },
        ],
        title: '3. 엔진부 설계',
      },
      {
        description: '완료·진행·미구현 항목과 이후 일정을 정리합니다.',
        fields: [
          {
            label: '완료된 내용',
            value: '팀 대시보드와 분반별 제출물 조회 화면',
          },
          {
            label: '진행 중인 내용',
            value: '마일스톤별 제출물 상세 조회',
          },
          {
            label: '미구현 내용',
            value: '실제 제출 API 연동과 파일 다운로드',
          },
          {
            label: '문제점 또는 지원 필요',
            value: '제출물 API의 파일 URL과 권한 계약 확인이 필요합니다.',
          },
        ],
        title: '4. 팀프로젝트 진행 계획',
      },
      {
        description:
          '대면 점검에서 확인받고 싶은 질문과 시연 초점을 작성합니다.',
        fields: [
          {
            label: '중점 시연 기능',
            value: '분반별 팀 제출물 조회부터 상세보기 이동까지의 흐름',
          },
          {
            label: '교수님께 질문할 내용',
            value: '마일스톤별 제출물 파일 다운로드 정책을 확인하고 싶습니다.',
          },
        ],
        title: '5. 중간 점검 질문',
      },
    ],
    teamLeaderName: '김민준',
    teamName: 'OOP-01 - 1팀',
  },
  proposal: null,
  presentation: null,
  section: {
    id: 'oop-2026-2-01',
    label: 'OOP-01',
  },
  submittedAt: '2026/10/12',
  submission: {
    id: 'submission-oop-01-1-midterm',
    teamId: 'team-1151-1',
    teamName: 'OOP-01 - 1팀',
  },
};

const presentationSubmissionDetail: AdminMilestoneSubmissionDetailResponse = {
  milestone: { id: 'presentation-submit', title: '발표 자료 제출' },
  midterm: null,
  presentation: {
    blocks: [
      {
        title: '1. 프로젝트 개요',
        description: '발표에서 소개할 프로젝트 내용을 정리합니다.',
        fields: [
          {
            label: '프로젝트 제목',
            value: 'AI 기반 팀 프로젝트 관리 서비스',
          },
          {
            label: '개요 요약',
            value: '팀 프로젝트 진행과 제출물을 관리합니다.',
          },
        ],
      },
      {
        title: '2. 주요 기능',
        description: '시연할 핵심 기능을 정리합니다.',
        fields: [
          {
            label: '기능 1',
            value:
              '예매 등록\n좌석 선택부터 예약 생성까지의 흐름을 처리합니다.',
          },
          {
            label: '기능 2',
            value:
              '결제 처리\n예매 정보와 결제 결과를 연결해 완료 상태를 저장합니다.',
          },
        ],
      },
      {
        title: '3. 주요 화면',
        description: '발표에서 보여줄 대표 화면을 정리합니다.',
        fields: [
          {
            label: '화면 1',
            value: '메인 화면\n상영 일정과 예매 현황을 확인합니다.',
          },
          {
            label: '화면 2',
            value: '예매 관리\n좌석 선택과 결제를 처리합니다.',
          },
        ],
      },
      {
        title: '4. 시연 영상',
        description: '발표에서 사용할 시연 영상 링크입니다.',
        fields: [],
      },
    ],
    presentationFileName: teamOneFiles?.presentation.presentationFileName ?? null,
    presentationFileDownloadUrl:
      teamOneFiles?.presentation.presentationFileDownloadUrl ?? null,
    sourceArchiveDownloadUrl:
      teamOneFiles?.presentation.sourceArchiveDownloadUrl ?? null,
    sourceArchiveFileName: teamOneFiles?.presentation.sourceArchiveFileName ?? null,
    teamLeaderName: '김민준',
    teamName: 'OOP-01 - 1팀',
    videoUrl: teamOneFiles?.presentation.videoUrl ?? null,
  },
  proposal: null,
  section: { id: 'oop-2026-2-01', label: 'OOP-01' },
  submittedAt: '2026/11/12',
  submission: {
    id: 'submission-oop-01-1-presentation-submit',
    teamId: 'team-1151-1',
    teamName: 'OOP-01 - 1팀',
  },
};

const secondTeamPresentationSubmissionDetail: AdminMilestoneSubmissionDetailResponse =
  {
    ...presentationSubmissionDetail,
    presentation: {
      ...presentationSubmissionDetail.presentation!,
      presentationFileName: teamTwoFiles?.presentation.presentationFileName ?? null,
      presentationFileDownloadUrl:
        teamTwoFiles?.presentation.presentationFileDownloadUrl ?? null,
      sourceArchiveDownloadUrl:
        teamTwoFiles?.presentation.sourceArchiveDownloadUrl ?? null,
      sourceArchiveFileName: teamTwoFiles?.presentation.sourceArchiveFileName ?? null,
      teamLeaderName: '박지훈',
      teamName: 'OOP-01 - 2팀',
      videoUrl: teamTwoFiles?.presentation.videoUrl ?? null,
    },
    submission: {
      id: 'submission-oop-01-2-presentation-submit',
      teamId: 'team-1151-2',
      teamName: 'OOP-01 - 2팀',
    },
  };

const secondTeamProposalSubmissionDetail: AdminMilestoneSubmissionDetailResponse =
  {
    ...proposalSubmissionDetail,
    proposal: {
      ...proposalSubmissionDetail.proposal!,
      members: ['박지훈', '최유진'],
      projectTitle: '분반 프로젝트 협업 보드',
      teamLeaderName: '박지훈',
      teamName: 'OOP-01 - 2팀',
    },
    submission: {
      id: 'submission-oop-01-2-proposal',
      teamId: 'team-1151-2',
      teamName: 'OOP-01 - 2팀',
    },
  };

const secondTeamMidtermSubmissionDetail: AdminMilestoneSubmissionDetailResponse =
  {
    ...midtermSubmissionDetail,
    midterm: {
      ...midtermSubmissionDetail.midterm!,
      blocks: midtermSubmissionDetail.midterm!.blocks.map(block =>
        block.title === '2. 화면 GUI 설계'
          ? {
              ...block,
              fields: block.fields.map(field =>
                field.label === '화면 GUI 목록'
                  ? { ...field, attachment: teamTwoFiles?.midterm[0] }
                  : field,
              ),
            }
          : block,
      ),
      teamLeaderName: '박지훈',
      teamName: 'OOP-01 - 2팀',
    },
    submission: {
      id: 'submission-oop-01-2-midterm',
      teamId: 'team-1151-2',
      teamName: 'OOP-01 - 2팀',
    },
  };

const peerEvaluationTeam = adminTeamsFixture.find(
  team => team.id === 'team-1151-1',
);
const peerEvaluationMembers = adminStudentsFixture.filter(
  student => student.teamId === peerEvaluationTeam?.id,
);

const peerEvaluationSubmissionDetail: AdminMilestoneSubmissionDetailResponse = {
  milestone: { id: 'peer-review', title: '상호 평가' },
  section: { id: 'oop-2026-2-01', label: 'OOP-01' },
  submittedAt: '2026/12/14',
  submission: {
    id: 'submission-oop-01-1-peer-review',
    teamId: 'team-1151-1',
    teamName: 'OOP-01 - 1팀',
  },
  proposal: null,
  midterm: null,
  presentation: null,
  peerEvaluation: {
    members: peerEvaluationMembers.map(({ name, studentNumber, major }) => ({
      name,
      studentNumber,
      major,
    })),
    responses: [
      {
        evaluatorStudentNumber: '20231234',
        projectEvaluation: {
          roleSummary: '팀 일정 관리와 백엔드 구현을 담당했습니다.',
          teamEvaluation: '협업 과정이 원활했고 목표한 기능을 완성했습니다.',
          reflection: '서로 피드백하며 결과물을 개선할 수 있었습니다.',
        },
        scores: { '20235678': 30 },
      },
    ],
  },
};

const presentationEvaluationCriteria = [
  { id: 'completion', label: '프로젝트 완성도' },
  { id: 'implementation', label: '기능 구성과 구현' },
  { id: 'delivery', label: '발표 전달력' },
];

function createPresentationEvaluationDetail(
  targetTeamId: string,
  submittedScoresByStudentNumber: Record<string, Record<string, number>>,
) {
  return adminStudentsFixture.map(student => {
    const isTargetTeamMember = student.teamId === targetTeamId;
    const scores = submittedScoresByStudentNumber[student.studentNumber];

    return {
      evaluatorName: student.name,
      evaluatorStudentNumber: student.studentNumber,
      isTargetTeamMember,
      scores: isTargetTeamMember
        ? { completion: null, delivery: null, implementation: null }
        : (scores ?? {
            completion: null,
            delivery: null,
            implementation: null,
          }),
      total:
        !isTargetTeamMember && scores
          ? Object.values(scores).reduce((sum, score) => sum + score, 0)
          : null,
    };
  });
}

const presentationEvaluationSubmissionDetail: AdminMilestoneSubmissionDetailResponse =
  {
    milestone: { id: 'presentation-evaluate', title: '발표 평가' },
    section: { id: 'oop-2026-2-01', label: 'OOP-01' },
    submittedAt: '2026/11/26',
    submission: {
      id: 'submission-oop-01-1-presentation-evaluate',
      teamId: 'team-1151-1',
      teamName: 'OOP-01 - 1팀',
    },
    proposal: null,
    midterm: null,
    presentation: null,
    presentationEvaluation: {
      criteria: presentationEvaluationCriteria,
      evaluations: createPresentationEvaluationDetail('team-1151-1', {
        '20234567': { completion: 5, delivery: 5, implementation: 4 },
        '20239876': { completion: 5, delivery: 5, implementation: 4 },
      }),
    },
  };

const secondTeamPresentationEvaluationSubmissionDetail: AdminMilestoneSubmissionDetailResponse =
  {
    ...presentationEvaluationSubmissionDetail,
    submission: {
      id: 'submission-oop-01-2-presentation-evaluate',
      teamId: 'team-1151-2',
      teamName: 'OOP-01 - 2팀',
    },
    presentationEvaluation: {
      ...presentationEvaluationSubmissionDetail.presentationEvaluation!,
      evaluations: createPresentationEvaluationDetail('team-1151-2', {}),
    },
  };

export function getAdminMilestoneSubmissionDetailFixture(
  submissionId: string,
): AdminMilestoneSubmissionDetailResponse | undefined {
  if (submissionId === proposalSubmissionDetail.submission.id) {
    return structuredClone(proposalSubmissionDetail);
  }

  if (submissionId === secondTeamProposalSubmissionDetail.submission.id) {
    return structuredClone(secondTeamProposalSubmissionDetail);
  }

  if (submissionId === midtermSubmissionDetail.submission.id) {
    return structuredClone(midtermSubmissionDetail);
  }

  if (submissionId === secondTeamMidtermSubmissionDetail.submission.id) {
    return structuredClone(secondTeamMidtermSubmissionDetail);
  }

  if (submissionId === peerEvaluationSubmissionDetail.submission.id) {
    return structuredClone(peerEvaluationSubmissionDetail);
  }

  if (submissionId === presentationEvaluationSubmissionDetail.submission.id) {
    return structuredClone(presentationEvaluationSubmissionDetail);
  }

  if (
    submissionId ===
    secondTeamPresentationEvaluationSubmissionDetail.submission.id
  ) {
    return structuredClone(secondTeamPresentationEvaluationSubmissionDetail);
  }

  if (submissionId === presentationSubmissionDetail.submission.id) {
    return structuredClone(presentationSubmissionDetail);
  }

  if (submissionId === secondTeamPresentationSubmissionDetail.submission.id) {
    return structuredClone(secondTeamPresentationSubmissionDetail);
  }

  return undefined;
}
