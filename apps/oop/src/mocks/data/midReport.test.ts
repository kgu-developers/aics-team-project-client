import { describe, expect, it } from 'vitest';

import {
  canCompleteMidReportBlock,
  completeMidReportBlock,
  ensureMidReportFeedbackRevision,
  getCurrentMidReport,
  hasResubmittedMidReportRevision,
  resetMidReportMockData,
  saveMidReportBlock,
  submitCurrentMidReport,
} from './midReport';

describe('mid-report fixture', () => {
  it('rejects a stale block save and preserves the current version', () => {
    const report = getCurrentMidReport();

    const topic = report.blocks.find(block => block.key === 'topic');
    if (!topic) throw new Error('topic fixture is required');

    const saved = saveMidReportBlock(
      'topic',
      report.version - 1,
      topic.fields,
      'OOP 데모 학생 A',
    );

    expect(saved).toBeNull();
    expect(getCurrentMidReport().version).toBe(report.version);
  });

  it('stores GUI design as independently repeatable screen-description rows', () => {
    const guiDesign = getCurrentMidReport().blocks.find(
      block => block.key === 'gui-design',
    );
    const field = guiDesign?.fields[0];
    const engineDesign = getCurrentMidReport().blocks.find(
      block => block.key === 'engine-design',
    );
    const testCases = engineDesign?.fields.find(
      item => item.key === 'testCases',
    );

    expect(field?.key).toBe('guiScreens');
    expect(JSON.parse(field?.value ?? '[]')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          description: expect.any(String),
          name: expect.any(String),
        }),
      ]),
    );
    expect(testCases?.key).toBe('testCases');
    expect(JSON.parse(testCases?.value ?? '[]')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          input: expect.any(String),
          output: expect.any(String),
        }),
      ]),
    );
  });

  it('rejects empty GUI rows and test cases with missing required values', () => {
    const report = getCurrentMidReport();
    const guiDesign = report.blocks.find(block => block.key === 'gui-design');
    const engineDesign = report.blocks.find(
      block => block.key === 'engine-design',
    );
    if (!guiDesign || !engineDesign)
      throw new Error('structured block fixtures are required');

    const withStructuredValue = <T extends typeof guiDesign>(
      block: T,
      fieldKey: string,
      rows: unknown[],
    ) => ({
      ...block,
      fields: block.fields.map(field =>
        field.key === fieldKey
          ? { ...field, value: JSON.stringify(rows) }
          : field,
      ),
    });

    expect(canCompleteMidReportBlock(guiDesign)).toBe(true);
    expect(canCompleteMidReportBlock({ ...guiDesign, fields: [] })).toBe(false);
    expect(
      canCompleteMidReportBlock(
        withStructuredValue(guiDesign, 'guiScreens', []),
      ),
    ).toBe(false);
    expect(
      canCompleteMidReportBlock(
        withStructuredValue(guiDesign, 'guiScreens', [
          { id: 'home', name: '메인 화면', description: ' ' },
        ]),
      ),
    ).toBe(false);

    expect(canCompleteMidReportBlock(engineDesign)).toBe(true);
    expect(
      canCompleteMidReportBlock({
        ...engineDesign,
        fields: engineDesign.fields.filter(field => field.key === 'testCases'),
      }),
    ).toBe(false);
    expect(
      canCompleteMidReportBlock(
        withStructuredValue(engineDesign, 'testCases', [
          {
            id: 'reservation-success',
            description: '예매 성공',
            input: 'seat=A1',
            output: '',
          },
        ]),
      ),
    ).toBe(false);
  });

  it('수정 요청 블록을 원본으로 되돌리면 재제출을 막고 실제 변경 뒤에만 허용한다', () => {
    resetMidReportMockData();
    const requested = ensureMidReportFeedbackRevision();
    const gui = requested.blocks.find(block => block.key === 'gui-design');
    if (!gui) throw new Error('GUI revision fixture is required');

    const changed = saveMidReportBlock(
      gui.key,
      requested.version,
      gui.fields.map(field =>
        field.key === 'guiScreens'
          ? { ...field, value: field.value.replace('메인 화면', '홈 화면') }
          : field,
      ),
      requested.teamLeaderName,
    );
    expect(changed?.revision?.changedBlockKeys).toEqual(['gui-design']);
    if (!changed) throw new Error('GUI revision save is required');

    const reverted = saveMidReportBlock(
      gui.key,
      changed.version,
      gui.fields,
      requested.teamLeaderName,
    );
    expect(reverted?.revision?.changedBlockKeys).toEqual([]);
    if (!reverted) throw new Error('reverted GUI revision save is required');
    const revertedCompletion = completeMidReportBlock(
      gui.key,
      reverted.version,
      requested.teamLeaderName,
    );
    if (!revertedCompletion)
      throw new Error('reverted GUI revision completion is required');
    expect(
      submitCurrentMidReport(
        revertedCompletion.version,
        requested.teamLeaderName,
      ),
    ).toBeNull();

    const changedAgain = saveMidReportBlock(
      gui.key,
      revertedCompletion.version,
      gui.fields.map(field =>
        field.key === 'guiScreens'
          ? { ...field, value: field.value.replace('메인 화면', '홈 화면') }
          : field,
      ),
      requested.teamLeaderName,
    );
    if (!changedAgain) throw new Error('second GUI revision save is required');
    const completed = completeMidReportBlock(
      gui.key,
      changedAgain.version,
      requested.teamLeaderName,
    );
    if (!completed) throw new Error('GUI revision completion is required');
    expect(
      submitCurrentMidReport(completed.version, requested.teamLeaderName),
    ).toMatchObject({
      status: 'SUBMITTED',
      revision: { resubmittedAt: expect.any(String) },
    });
    expect(hasResubmittedMidReportRevision()).toBe(true);
  });
});
