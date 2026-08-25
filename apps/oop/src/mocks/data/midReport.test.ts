import { describe, expect, it } from 'vitest';

import {
  canCompleteMidReportBlock,
  getCurrentMidReport,
  saveMidReportBlock,
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
});
