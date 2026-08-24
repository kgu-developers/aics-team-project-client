import type { Presentation, PresentationBlock } from '@aics/core';

import {
  areDocumentFieldsComplete,
  completeDocumentSessionBlock,
  hasRequiredTextValues,
  saveDocumentSessionBlock,
  submitDocumentSession,
} from './documentSession';
import { getSubmissionByMilestone } from './submission';

export const demoPresentationTeamId = 'team-07';

const block = (
  key: PresentationBlock['key'],
  title: string,
  description: string,
  fields: PresentationBlock['fields'],
): PresentationBlock => ({
  key,
  title,
  description,
  fields,
  status: 'IN_PROGRESS',
  lock: null,
  lastEditedBy: 'OOP 데모 학생 A',
  lastSavedAt: '2026-11-02T15:40:00+09:00',
});

let presentation: Presentation = {
  id: 'presentation-team-07',
  teamId: demoPresentationTeamId,
  title: 'CineFlow 발표',
  version: 2,
  dueDate: '2026-11-04T23:59:59+09:00',
  status: 'DRAFT',
  teamLeaderName: 'OOP 데모 학생 A',
  submittedAt: null,
  submittedBy: null,
  blocks: [
    block(
      'project-overview',
      '1. 프로젝트 개요',
      '발표에서 가장 먼저 소개할 프로젝트 요약을 작성합니다.',
      [
        {
          key: 'title',
          label: '프로젝트 제목',
          value: 'CineFlow · 영화관 통합 관리 시스템',
        },
        {
          key: 'summary',
          label: '개요 요약',
          value:
            '상영 등록부터 좌석 선택·예매·결제까지 영화관 운영 흐름을 하나로 연결합니다.',
          multiline: true,
        },
      ],
    ),
    // 프레젠테이션 자료는 KD3-90 제출 계약(SubmissionFilePanel)으로
    // PPT/PPTX를 등록·교체한다. 문서 필드 블록으로 위조하지 않는다.
    block(
      'presentation-material',
      '2. 프레젠테이션 자료',
      '발표 슬라이드(PPT/PPTX)를 등록하거나 교체합니다.',
      [],
    ),
    block(
      'main-features',
      '3. 주요 기능',
      '시연 가능한 핵심 기능을 중심으로 정리합니다.',
      [
        {
          key: 'featureItems',
          label: '주요 기능 목록',
          value: JSON.stringify([
            {
              id: 'reservation',
              name: '예매 등록',
              description: '좌석 선택부터 예약 생성까지의 흐름을 처리합니다.',
            },
            {
              id: 'payment',
              name: '결제 처리',
              description:
                '예매 정보와 결제 결과를 연결해 완료 상태를 저장합니다.',
            },
          ]),
        },
      ],
    ),
    block(
      'main-screens',
      '4. 주요 화면',
      '발표에서 보여줄 대표 화면을 설명합니다.',
      [
        {
          key: 'screenItems',
          label: '주요 화면 목록',
          value: JSON.stringify([
            {
              id: 'home',
              name: '메인 화면',
              description: '상영 일정과 예매 현황을 확인합니다.',
            },
            {
              id: 'reservation',
              name: '예매 관리',
              description: '좌석 선택과 결제를 처리합니다.',
            },
          ]),
        },
      ],
    ),
    // 시연 영상은 파일 저장소 계약이 없어 이번 범위에서 등록할 수 없다.
    block(
      'demo-video',
      '5. 시연 영상',
      'YouTube 시연 영상 링크를 등록합니다.',
      [
        {
          key: 'youtubeUrl',
          label: 'YouTube 시연 영상 URL',
          value: 'https://youtu.be/dQw4w9WgXcQ',
        },
      ],
    ),
  ],
};

const initialPresentation = structuredClone(presentation);

const requiredFieldKeysByBlock: Record<
  PresentationBlock['key'],
  readonly string[]
> = {
  'project-overview': ['title', 'summary'],
  'presentation-material': [],
  'main-features': ['featureItems'],
  'main-screens': ['screenItems'],
  'demo-video': ['youtubeUrl'],
};

export function getCurrentPresentation() {
  return presentation;
}

export function isPresentationSubmitted() {
  return presentation.status === 'SUBMITTED';
}

export function markPresentationMaterialChanged(editorName: string) {
  if (presentation.status === 'SUBMITTED') return null;

  const material = presentation.blocks.find(
    block => block.key === 'presentation-material',
  );
  if (!material) return null;

  presentation = {
    ...presentation,
    version: presentation.version + 1,
    blocks: presentation.blocks.map(block =>
      block.key === 'presentation-material'
        ? {
            ...block,
            status: 'IN_PROGRESS',
            lastEditedBy: editorName,
            lastSavedAt: new Date().toISOString(),
          }
        : block,
    ),
  };
  return getCurrentPresentation();
}

export function savePresentationBlock(
  blockKey: PresentationBlock['key'],
  version: number,
  fields: PresentationBlock['fields'],
  editorName: string,
) {
  const saved = saveDocumentSessionBlock(
    presentation,
    blockKey,
    version,
    fields,
    editorName,
  );
  if (saved) presentation = saved;
  return saved;
}

function isYouTubeUrl(value: string) {
  try {
    const url = new URL(value);
    return ['youtube.com', 'www.youtube.com', 'youtu.be'].includes(
      url.hostname,
    );
  } catch {
    return false;
  }
}

export function canCompletePresentationBlock(block: PresentationBlock) {
  if (block.key === 'presentation-material') {
    return Boolean(
      block.fields.length === 0 &&
      getSubmissionByMilestone(demoPresentationTeamId, 'presentation')
        ?.currentVersion,
    );
  }
  if (block.key === 'demo-video') {
    return Boolean(
      areDocumentFieldsComplete(
        block.fields,
        requiredFieldKeysByBlock[block.key],
      ) &&
      block.fields.find(
        field => field.key === 'youtubeUrl' && isYouTubeUrl(field.value),
      ),
    );
  }
  if (block.key === 'main-features')
    return areDocumentFieldsComplete(
      block.fields,
      requiredFieldKeysByBlock[block.key],
      {
        featureItems: row =>
          hasRequiredTextValues(row, ['id', 'name', 'description']),
      },
    );
  if (block.key === 'main-screens')
    return areDocumentFieldsComplete(
      block.fields,
      requiredFieldKeysByBlock[block.key],
      {
        screenItems: row =>
          hasRequiredTextValues(row, ['id', 'name', 'description']),
      },
    );
  return areDocumentFieldsComplete(
    block.fields,
    requiredFieldKeysByBlock[block.key],
  );
}

export function completePresentationBlock(
  blockKey: PresentationBlock['key'],
  version: number,
  editorName: string,
) {
  const completed = completeDocumentSessionBlock(
    presentation,
    blockKey,
    version,
    editorName,
    canCompletePresentationBlock,
  );
  if (completed) presentation = completed;
  return completed;
}

export function submitCurrentPresentation(
  version: number,
  submitterName: string,
) {
  const submitted = submitDocumentSession(presentation, version, submitterName);
  if (submitted) presentation = submitted;
  return submitted;
}

export function resetPresentationMockData() {
  presentation = structuredClone(initialPresentation);
}
