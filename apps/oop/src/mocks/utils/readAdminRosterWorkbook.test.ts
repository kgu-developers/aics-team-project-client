import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';

import {
  findAdminRosterColumn,
  getAdminRosterValue,
  readAdminRosterWorkbook,
} from './readAdminRosterWorkbook';

async function workbookFile(rows: readonly (readonly string[])[]) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('명단');
  rows.forEach(row => worksheet.addRow([...row]));
  const buffer = await workbook.xlsx.writeBuffer();
  return new File([new Uint8Array(buffer)], '명단.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

describe('readAdminRosterWorkbook', () => {
  it('첫 시트의 헤더와 빈 행을 제외한 데이터를 읽는다', async () => {
    const file = await workbookFile([
      ['학번', '이름', '학과'],
      ['20260001', '김학생', '컴퓨터공학과'],
      ['', '', ''],
    ]);

    const result = await readAdminRosterWorkbook(file);

    expect(result.rows).toHaveLength(1);
    expect(
      getAdminRosterValue(result, result.rows[0]!, ['전공', '학과', '소속']),
    ).toBe('컴퓨터공학과');
    expect(findAdminRosterColumn(result.headers, ['학번'])).toEqual([0]);
  });
});
