import { beforeEach, describe, expect, it } from 'vitest';

import {
  canSubmitMidReportDocument,
  getMidReportSubmitDisabledReason,
} from './MidReportEditorPage';

import {
  ensureMidReportFeedbackRevision,
  resetMidReportMockData,
} from '~/mocks/data/midReport';

describe('MidReportEditorPage 수정본 제출 조건', () => {
  beforeEach(() => resetMidReportMockData());

  it('GUI 영역 자체가 없으면 빈 카드가 아니라 보고서 형식 오류로 알린다', () => {
    const report = ensureMidReportFeedbackRevision();
    const document = {
      ...report,
      blocks: report.blocks.filter(block => block.key !== 'gui-design'),
    };
    expect(canSubmitMidReportDocument(document, report.teamLeaderName)).toBe(
      false,
    );
    expect(
      getMidReportSubmitDisabledReason(document, report.teamLeaderName),
    ).toBe('중간보고서에 화면 GUI 영역이 없어요. 다시 불러와 주세요.');
  });

  it('완료 상태인 기존 GUI에서도 내용이 비어 있으면 해당 카드와 입력 항목을 알린다', () => {
    const report = ensureMidReportFeedbackRevision();
    const document = {
      ...report,
      blocks: report.blocks.map(block => ({
        ...block,
        status: 'COMPLETED' as const,
        fields: block.fields.map(field =>
          field.key === 'guiScreens'
            ? {
                ...field,
                value: JSON.stringify([
                  { id: 'one', name: '홈 화면', description: '  ' },
                ]),
              }
            : field,
        ),
      })),
    };
    expect(canSubmitMidReportDocument(document, report.teamLeaderName)).toBe(
      false,
    );
    expect(
      getMidReportSubmitDisabledReason(document, report.teamLeaderName),
    ).toContain('화면 1: 설명');
  });

  it('수정 요청 블록을 다시 완료하면 내용 변경 없이도 재제출을 허용한다', () => {
    const requested = ensureMidReportFeedbackRevision();
    const completedWithoutChange = {
      ...requested,
      blocks: requested.blocks.map(block => ({
        ...block,
        status: 'COMPLETED' as const,
      })),
    };

    expect(
      canSubmitMidReportDocument(
        completedWithoutChange,
        requested.teamLeaderName,
      ),
    ).toBe(true);
    expect(
      getMidReportSubmitDisabledReason(
        completedWithoutChange,
        requested.teamLeaderName,
      ),
    ).toBe('피드백을 반영한 수정본을 다시 제출할 수 있어요.');

    const changedAndCompleted = {
      ...completedWithoutChange,
      revision: {
        ...requested.revision!,
        changedBlockKeys: [...requested.revision!.affectedBlockKeys],
      },
    };
    expect(
      canSubmitMidReportDocument(changedAndCompleted, requested.teamLeaderName),
    ).toBe(true);
    expect(
      getMidReportSubmitDisabledReason(
        changedAndCompleted,
        requested.teamLeaderName,
      ),
    ).toBe('피드백을 반영한 수정본을 다시 제출할 수 있어요.');
  });
});
