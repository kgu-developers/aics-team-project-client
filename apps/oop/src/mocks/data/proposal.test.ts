import { describe, expect, it } from 'vitest';

import {
  canCompleteProposalBlock,
  completeProposalBlock,
  ensureProposalFeedbackRevision,
  getCurrentProposal,
  hasResubmittedProposalRevision,
  resetProposalFixture,
  saveProposalBlock,
  submitCurrentProposal,
} from './proposal';

describe('proposal fixture', () => {
  it('rejects a stale block save and preserves the current version', () => {
    resetProposalFixture();
    const proposal = getCurrentProposal();
    const topic = proposal.blocks.find(block => block.key === 'topic');
    if (!topic) throw new Error('topic fixture is required');

    const saved = saveProposalBlock(
      'topic',
      proposal.version - 1,
      topic.fields,
      'OOP 데모 학생 A',
    );

    expect(saved).toBeNull();
    expect(getCurrentProposal().version).toBe(proposal.version);
  });

  it('returns a completed section to in progress when saved content changes', () => {
    resetProposalFixture();
    const proposal = getCurrentProposal();
    const teamInfo = proposal.blocks.find(block => block.key === 'team-info');
    if (!teamInfo) throw new Error('team-info fixture is required');

    const saved = saveProposalBlock(
      'team-info',
      proposal.version,
      teamInfo.fields.map(field =>
        field.key === 'teamName' ? { ...field, value: 'CineFlow 7팀' } : field,
      ),
      'OOP 데모 학생 A',
    );

    expect(saved?.blocks.find(block => block.key === 'team-info')?.status).toBe(
      'IN_PROGRESS',
    );
  });

  it('allows only the leader to submit after every section is completed', () => {
    resetProposalFixture();
    let proposal = getCurrentProposal();
    for (const block of proposal.blocks.filter(
      block => block.status !== 'COMPLETED',
    )) {
      const completed = completeProposalBlock(
        block.key,
        proposal.version,
        'OOP 데모 학생 A',
      );
      if (!completed) throw new Error('completion fixture is required');
      proposal = completed;
    }

    expect(
      submitCurrentProposal(proposal.version, 'OOP 데모 학생 B'),
    ).toBeNull();
    expect(
      submitCurrentProposal(proposal.version, 'OOP 데모 학생 A'),
    ).toMatchObject({
      status: 'SUBMITTED',
      submittedBy: 'OOP 데모 학생 A',
    });
  });

  it('수정 요청 블록을 원본으로 되돌리면 변경 표시를 제거하고 실제 변경 뒤에만 재제출한다', () => {
    resetProposalFixture();
    const requested = ensureProposalFeedbackRevision();
    const topic = requested.blocks.find(block => block.key === 'topic');
    if (!topic) throw new Error('topic revision fixture is required');

    const unchanged = saveProposalBlock(
      topic.key,
      requested.version,
      topic.fields,
      requested.teamLeaderName,
    );
    expect(unchanged?.revision?.changedBlockKeys).toEqual([]);
    if (!unchanged) throw new Error('unchanged revision save is required');

    const changed = saveProposalBlock(
      topic.key,
      unchanged.version,
      topic.fields.map(field =>
        field.key === 'description'
          ? { ...field, value: `${field.value} 운영자 요구를 보완합니다.` }
          : field,
      ),
      requested.teamLeaderName,
    );
    expect(changed?.revision?.changedBlockKeys).toEqual(['topic']);
    if (!changed) throw new Error('changed revision save is required');

    const reverted = saveProposalBlock(
      topic.key,
      changed.version,
      topic.fields,
      requested.teamLeaderName,
    );
    expect(reverted?.revision?.changedBlockKeys).toEqual([]);
    if (!reverted) throw new Error('reverted revision save is required');
    const revertedCompletion = completeProposalBlock(
      topic.key,
      reverted.version,
      requested.teamLeaderName,
    );
    if (!revertedCompletion)
      throw new Error('reverted revision completion is required');
    expect(
      submitCurrentProposal(
        revertedCompletion.version,
        requested.teamLeaderName,
      ),
    ).toBeNull();

    const changedAgain = saveProposalBlock(
      topic.key,
      revertedCompletion.version,
      topic.fields.map(field =>
        field.key === 'description'
          ? { ...field, value: `${field.value} 운영자 요구를 보완합니다.` }
          : field,
      ),
      requested.teamLeaderName,
    );
    if (!changedAgain) throw new Error('second revision save is required');
    const completed = completeProposalBlock(
      topic.key,
      changedAgain.version,
      requested.teamLeaderName,
    );
    if (!completed) throw new Error('revision completion is required');
    expect(
      submitCurrentProposal(completed.version, requested.teamLeaderName),
    ).toMatchObject({
      status: 'SUBMITTED',
      revision: { resubmittedAt: expect.any(String) },
    });
    expect(hasResubmittedProposalRevision()).toBe(true);
  });

  it('exposes the five proposal sections in document order', () => {
    resetProposalFixture();
    expect(getCurrentProposal().blocks.map(block => block.key)).toEqual([
      'team-info',
      'topic',
      'data-composition',
      'screen-composition',
      'team-operations',
    ]);
  });

  it('stores data and screen composition as repeatable form rows', () => {
    resetProposalFixture();
    const proposal = getCurrentProposal();
    const dataRows = proposal.blocks.find(
      block => block.key === 'data-composition',
    )?.fields[0];
    const screenFields = proposal.blocks.find(
      block => block.key === 'screen-composition',
    )?.fields;

    expect(dataRows?.key).toBe('dataRows');
    expect(JSON.parse(dataRows?.value ?? '[]')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ count: expect.any(Number) }),
      ]),
    );
    expect(screenFields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'wireframeImageNames' }),
        expect.objectContaining({ key: 'screenDescription' }),
      ]),
    );
  });

  it('rejects empty or incomplete data rows from section completion', () => {
    resetProposalFixture();
    const dataBlock = getCurrentProposal().blocks.find(
      block => block.key === 'data-composition',
    );
    if (!dataBlock) throw new Error('data-composition fixture is required');

    const withRows = (rows: unknown[]) => ({
      ...dataBlock,
      fields: dataBlock.fields.map(field =>
        field.key === 'dataRows'
          ? { ...field, value: JSON.stringify(rows) }
          : field,
      ),
    });

    expect(canCompleteProposalBlock(dataBlock)).toBe(true);
    expect(canCompleteProposalBlock({ ...dataBlock, fields: [] })).toBe(false);
    expect(canCompleteProposalBlock(withRows([]))).toBe(false);
    expect(
      canCompleteProposalBlock(
        withRows([
          { id: 'movies', name: ' ', description: '영화 정보', count: 20 },
        ]),
      ),
    ).toBe(false);
    expect(
      canCompleteProposalBlock(
        withRows([
          { id: 'movies', name: '영화', description: '영화 정보', count: 0 },
        ]),
      ),
    ).toBe(false);
  });

  it('requires every screen field and at least one wireframe image', () => {
    resetProposalFixture();
    const screenBlock = getCurrentProposal().blocks.find(
      block => block.key === 'screen-composition',
    );
    if (!screenBlock) throw new Error('screen-composition fixture is required');

    expect(canCompleteProposalBlock(screenBlock)).toBe(true);
    expect(
      canCompleteProposalBlock({
        ...screenBlock,
        fields: screenBlock.fields.filter(
          field => field.key !== 'screenDescription',
        ),
      }),
    ).toBe(false);
    expect(
      canCompleteProposalBlock({
        ...screenBlock,
        fields: screenBlock.fields.map(field =>
          field.key === 'wireframeImageNames'
            ? { ...field, value: '[]' }
            : field,
        ),
      }),
    ).toBe(false);
  });
});
