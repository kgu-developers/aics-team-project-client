import { beforeEach, describe, expect, it } from 'vitest';

import {
  canSubmitProposalDocument,
  getProposalSubmitDisabledReason,
} from './ProposalEditorPage';

import {
  ensureProposalFeedbackRevision,
  resetProposalFixture,
} from '~/mocks/data/proposal';

describe('ProposalEditorPage 수정본 제출 조건', () => {
  beforeEach(() => resetProposalFixture());

  it('피드백 대상 블록을 실제로 변경하고 완료해야 수정본 제출을 허용한다', () => {
    const requested = ensureProposalFeedbackRevision();
    const completedWithoutChange = {
      ...requested,
      blocks: requested.blocks.map(block => ({
        ...block,
        status: 'COMPLETED' as const,
      })),
    };

    expect(
      canSubmitProposalDocument(
        completedWithoutChange,
        requested.teamLeaderName,
      ),
    ).toBe(false);
    expect(
      getProposalSubmitDisabledReason(
        completedWithoutChange,
        requested.teamLeaderName,
      ),
    ).toBe('피드백 대상 영역을 실제로 수정한 뒤 다시 완료해 주세요.');

    const changedAndCompleted = {
      ...completedWithoutChange,
      revision: {
        ...requested.revision!,
        changedBlockKeys: [...requested.revision!.affectedBlockKeys],
      },
    };
    expect(
      canSubmitProposalDocument(changedAndCompleted, requested.teamLeaderName),
    ).toBe(true);
    expect(
      getProposalSubmitDisabledReason(
        changedAndCompleted,
        requested.teamLeaderName,
      ),
    ).toBe('피드백을 반영한 수정본을 다시 제출할 수 있어요.');
  });
});
