import type { Proposal, ProposalBlock, ProposalBlockKey } from '@aics/core';

import {
  areDocumentFieldsComplete,
  completeDocumentSessionBlock,
  hasNonEmptyStringArray,
  hasRequiredTextValues,
  saveDocumentSessionBlock,
  submitDocumentSession,
} from './documentSession';

export const demoProposalTeamId = 'team-07';
export const demoProposalLeaderName = 'OOP 데모 학생 A';

const block = (
  key: ProposalBlockKey,
  title: string,
  description: string,
  fields: ProposalBlock['fields'],
  status: ProposalBlock['status'] = 'IN_PROGRESS',
): ProposalBlock => ({
  key,
  title,
  description,
  fields,
  status,
  lock: null,
  lastEditedBy: demoProposalLeaderName,
  lastSavedAt: '2026-09-28T10:12:00+09:00',
});

function createProposal(): Proposal {
  return {
    id: 'proposal-team-07',
    teamId: demoProposalTeamId,
    title: 'CineFlow 제안서',
    version: 1,
    dueDate: '2026-10-05T23:59:59+09:00',
    status: 'DRAFT',
    teamLeaderName: demoProposalLeaderName,
    submittedAt: null,
    submittedBy: null,
    blocks: [
      block(
        'team-info',
        '1. 팀 정보',
        '팀 구성과 역할을 한눈에 볼 수 있게 정리합니다.',
        [
          { key: 'teamName', label: '팀명', value: 'CineFlow (7팀)' },
          { key: 'leader', label: '팀장', value: demoProposalLeaderName },
          {
            key: 'members',
            label: '팀원',
            value: 'OOP 데모 학생 B\nOOP 데모 학생 C',
            multiline: true,
          },
          {
            key: 'introduction',
            label: '팀 소개',
            value: '영화 데이터를 다루는 웹 서비스로 함께 성장하는 팀입니다.',
            multiline: true,
          },
        ],
        'COMPLETED',
      ),
      block(
        'topic',
        '2. 주제',
        '제안 주제와 기대 효과를 구체적으로 작성합니다.',
        [
          {
            key: 'title',
            label: '프로젝트 제목',
            value: 'CineFlow · 영화관 통합 관리 시스템',
          },
          {
            key: 'description',
            label: '주제 설명',
            value: '상영 일정, 좌석, 예매와 결제 흐름을 통합 관리합니다.',
            multiline: true,
          },
        ],
        'COMPLETED',
      ),
      block(
        'data-composition',
        '3. 데이터 구성',
        '데이터 단위별 예상 건수와 설명을 표로 정리합니다.',
        [
          {
            key: 'dataRows',
            label: '데이터 목록',
            value: JSON.stringify([
              {
                id: 'movies',
                name: '영화',
                description: '상영 가능한 영화 기본 정보',
                count: 20,
              },
              {
                id: 'screenings',
                name: '상영 일정',
                description: '영화별 상영관과 시간표',
                count: 120,
              },
              {
                id: 'reservations',
                name: '예매',
                description: '좌석별 예매 기록',
                count: 200,
              },
            ]),
          },
        ],
      ),
      block(
        'screen-composition',
        '4. 화면 구성',
        '핵심 화면과 사용자 행동을 화면별로 정리합니다.',
        [
          {
            key: 'wireframeImageNames',
            label: '와이어프레임 이미지',
            value: JSON.stringify(['cineflow-home-wireframe.png']),
          },
          {
            key: 'screenDescription',
            label: '화면 구성 설명',
            value:
              '메인에서 상영 일정을 탐색하고, 좌석 선택과 결제를 거쳐 예매 내역을 확인합니다.',
            multiline: true,
          },
        ],
      ),
      block(
        'team-operations',
        '5. 팀 운영 방식',
        '역할 분담과 협업 규칙, 진행 일정을 정리합니다.',
        [
          {
            key: 'roles',
            label: '역할 분담',
            value: 'A: 도메인/백엔드 · B: 화면 · C: 데이터/문서',
            multiline: true,
          },
          {
            key: 'collaboration',
            label: '협업 방식',
            value: '주 2회 대면 회의, GitHub PR 리뷰 후 병합',
            multiline: true,
          },
          {
            key: 'schedule',
            label: '진행 일정',
            value: '9월 도메인 설계 → 10월 중간보고서 → 11월 발표·최종 제출',
            multiline: true,
          },
        ],
      ),
    ],
  };
}

let proposal = createProposal();

const requiredFieldKeysByBlock: Record<ProposalBlockKey, readonly string[]> = {
  'team-info': ['teamName', 'leader', 'members', 'introduction'],
  topic: ['title', 'description'],
  'data-composition': ['dataRows'],
  'screen-composition': ['wireframeImageNames', 'screenDescription'],
  'team-operations': ['roles', 'collaboration', 'schedule'],
};

export function getCurrentProposal() {
  return proposal;
}

export function saveProposalBlock(
  blockKey: ProposalBlockKey,
  version: number,
  fields: ProposalBlock['fields'],
  editorName: string,
) {
  const saved = saveDocumentSessionBlock(
    proposal,
    blockKey,
    version,
    fields,
    editorName,
  );
  if (saved) proposal = saved;
  return saved;
}

export function canCompleteProposalBlock(block: ProposalBlock) {
  if (block.key === 'data-composition')
    return areDocumentFieldsComplete(
      block.fields,
      requiredFieldKeysByBlock[block.key],
      {
        dataRows: row =>
          hasRequiredTextValues(row, ['id', 'name', 'description']) &&
          typeof row.count === 'number' &&
          Number.isInteger(row.count) &&
          row.count > 0,
      },
    );
  if (block.key === 'screen-composition') {
    const wireframes = block.fields.find(
      field => field.key === 'wireframeImageNames',
    );
    return (
      areDocumentFieldsComplete(
        block.fields,
        requiredFieldKeysByBlock[block.key],
      ) && Boolean(wireframes && hasNonEmptyStringArray(wireframes.value))
    );
  }
  return areDocumentFieldsComplete(
    block.fields,
    requiredFieldKeysByBlock[block.key],
  );
}

export function completeProposalBlock(
  blockKey: ProposalBlockKey,
  version: number,
  editorName: string,
) {
  const completed = completeDocumentSessionBlock(
    proposal,
    blockKey,
    version,
    editorName,
    canCompleteProposalBlock,
  );
  if (completed) proposal = completed;
  return completed;
}

export function submitCurrentProposal(version: number, submitterName: string) {
  const submitted = submitDocumentSession(proposal, version, submitterName);
  if (submitted) proposal = submitted;
  return submitted;
}

export function resetProposalFixture() {
  proposal = createProposal();
}
