import type { MidReport, MidReportBlock } from '@aics/core';

import {
  areDocumentFieldsComplete,
  completeDocumentSessionBlock,
  hasRequiredDocumentRevisionChanges,
  hasRequiredTextValues,
  hasResubmittedDocumentRevision,
  requestDocumentSessionRevision,
  saveDocumentSessionBlock,
  submitDocumentSession,
} from './documentSession';

export const demoMidReportTeamId = 'team-07';

const block = (
  key: MidReportBlock['key'],
  title: string,
  description: string,
  fields: MidReportBlock['fields'],
): MidReportBlock => ({
  key,
  title,
  description,
  fields,
  status: 'IN_PROGRESS',
  lock: null,
  lastEditedBy: 'OOP 데모 학생 A',
  lastSavedAt: '2026-10-20T14:32:00+09:00',
});

let midReport: MidReport = {
  id: 'mid-report-team-07',
  teamId: demoMidReportTeamId,
  title: 'CineFlow 중간보고서',
  version: 3,
  dueDate: '2026-10-26T23:59:59+09:00',
  status: 'DRAFT',
  teamLeaderName: 'OOP 데모 학생 A',
  submittedAt: null,
  submittedBy: null,
  revision: null,
  blocks: [
    block(
      'topic',
      '1. 주제',
      '제안서에서 확정된 주제와 현재 기획 방향을 정리합니다.',
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
    ),
    block(
      'gui-design',
      '2. 화면 GUI 설계',
      '화면별 이름과 동작 설명을 한 세트씩 등록합니다.',
      [
        {
          key: 'guiScreens',
          label: '화면 GUI 목록',
          value: JSON.stringify([
            {
              id: 'home',
              name: '메인 화면',
              description: '상영 일정과 예매 현황을 확인합니다.',
              imageName: 'cineflow-home.png',
            },
            {
              id: 'reservation',
              name: '예매 관리',
              description: '좌석 선택과 결제를 처리합니다.',
              imageName: 'cineflow-reservation.png',
            },
          ]),
        },
      ],
    ),
    block(
      'engine-design',
      '3. 엔진부 설계',
      '클래스 구조와 기능 로직, 실행 관련 파일을 정리합니다.',
      [
        {
          key: 'features',
          label: '구현된 기능 목록',
          value: '상영작 관리 · 좌석 조회 · 예매 등록 · 결제 처리',
          multiline: true,
        },
        {
          key: 'architecture',
          label: '클래스 구조와 주요 기능 설명',
          value:
            'Movie, Screening, Seat, Reservation 도메인과 예매 흐름의 책임을 분리합니다.',
          multiline: true,
        },
        {
          key: 'testCases',
          label: '입력·출력 테스트 케이스',
          value: JSON.stringify([
            {
              id: 'reservation-success',
              description: '예약 가능한 좌석을 선택해 예매합니다.',
              input: 'movieId=1\nscreeningId=3\nseat=A1',
              output: '예약 완료: A1',
            },
          ]),
        },
      ],
    ),
    block(
      'project-plan',
      '4. 팀프로젝트 진행 계획',
      '완료·진행·미구현 항목과 이후 일정을 정리합니다.',
      [
        {
          key: 'completed',
          label: '완료된 내용',
          value: '도메인 모델과 예매 핵심 흐름',
        },
        {
          key: 'inProgress',
          label: '진행 중인 내용',
          value: 'GUI 연동 · 예외 처리 · 통합 테스트',
        },
        {
          key: 'remaining',
          label: '미구현 내용',
          value: '관리자 통계와 데이터 내보내기',
        },
        {
          key: 'help',
          label: '문제점 또는 지원 필요',
          value: '좌석 동시성 처리 방식 검토가 필요합니다.',
          multiline: true,
        },
      ],
    ),
  ],
};

const initialMidReport = structuredClone(midReport);

const requiredFieldKeysByBlock: Record<
  MidReportBlock['key'],
  readonly string[]
> = {
  topic: ['title', 'description'],
  'gui-design': ['guiScreens'],
  'engine-design': ['features', 'architecture', 'testCases'],
  'project-plan': ['completed', 'inProgress', 'remaining', 'help'],
};

export function getCurrentMidReport() {
  return midReport;
}

export function saveMidReportBlock(
  blockKey: MidReportBlock['key'],
  version: number,
  fields: MidReportBlock['fields'],
  editorName: string,
) {
  const saved = saveDocumentSessionBlock(
    midReport,
    blockKey,
    version,
    fields,
    editorName,
  );
  if (saved) midReport = saved;
  return saved;
}

export function canCompleteMidReportBlock(block: MidReportBlock) {
  if (block.key === 'gui-design')
    return areDocumentFieldsComplete(
      block.fields,
      requiredFieldKeysByBlock[block.key],
      {
        guiScreens: row =>
          hasRequiredTextValues(row, ['id', 'name', 'description']),
      },
    );
  if (block.key === 'engine-design')
    return areDocumentFieldsComplete(
      block.fields,
      requiredFieldKeysByBlock[block.key],
      {
        testCases: row =>
          hasRequiredTextValues(row, ['id', 'description', 'input', 'output']),
      },
    );
  return areDocumentFieldsComplete(
    block.fields,
    requiredFieldKeysByBlock[block.key],
  );
}

export function completeMidReportBlock(
  blockKey: MidReportBlock['key'],
  version: number,
  editorName: string,
) {
  const completed = completeDocumentSessionBlock(
    midReport,
    blockKey,
    version,
    editorName,
    canCompleteMidReportBlock,
  );
  if (completed) midReport = completed;
  return completed;
}

export function submitCurrentMidReport(version: number, submitterName: string) {
  const submitted = submitDocumentSession(midReport, version, submitterName);
  if (submitted) midReport = submitted;
  return submitted;
}

export function requestCurrentMidReportRevision() {
  const requested = requestDocumentSessionRevision(midReport, ['gui-design']);
  if (requested) midReport = requested;
  return requested;
}

export function ensureMidReportFeedbackRevision() {
  if (midReport.status === 'DRAFT') {
    const completedReport: MidReport = {
      ...midReport,
      blocks: midReport.blocks.map(item => ({
        ...item,
        status: 'COMPLETED',
      })),
    };
    const submitted = submitDocumentSession(
      completedReport,
      completedReport.version,
      completedReport.teamLeaderName,
    );
    if (submitted) midReport = submitted;
  }
  if (midReport.status === 'SUBMITTED' && !midReport.revision) {
    requestCurrentMidReportRevision();
  }
  return midReport;
}

export function ensureMidReportFeedbackRevisionResubmitted() {
  if (hasResubmittedMidReportRevision()) return midReport;

  const requested = ensureMidReportFeedbackRevision();
  if (requested.status !== 'REVISION_REQUESTED') return midReport;

  const gui = requested.blocks.find(item => item.key === 'gui-design');
  if (!gui) return midReport;

  const saved = saveMidReportBlock(
    gui.key,
    requested.version,
    gui.fields.map(field =>
      field.key === 'guiScreens'
        ? {
            ...field,
            value: field.value.replace(
              '상영 일정과 예매 현황을 확인합니다.',
              '검색 단계를 줄인 상영 일정과 예매 현황을 확인합니다.',
            ),
          }
        : field,
    ),
    requested.teamLeaderName,
  );
  if (!saved) return midReport;

  const completed = completeMidReportBlock(
    gui.key,
    saved.version,
    requested.teamLeaderName,
  );
  if (!completed) return midReport;

  submitCurrentMidReport(completed.version, requested.teamLeaderName);
  return midReport;
}

export function hasRequiredMidReportRevisionChanges() {
  return hasRequiredDocumentRevisionChanges(midReport);
}

export function hasResubmittedMidReportRevision() {
  return hasResubmittedDocumentRevision(midReport);
}

export function resetMidReportMockData() {
  midReport = structuredClone(initialMidReport);
}
