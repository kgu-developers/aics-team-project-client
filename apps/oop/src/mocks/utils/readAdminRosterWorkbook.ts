import ExcelJS from 'exceljs';

export type AdminRosterWorkbookRow = {
  rowNumber: number;
  values: readonly string[];
};

export type AdminRosterWorkbook = {
  headers: readonly string[];
  rows: readonly AdminRosterWorkbookRow[];
};

function normalize(value: string) {
  return value.trim().replace(/\s+/g, '').toLowerCase();
}

export async function readAdminRosterWorkbook(
  file: File,
): Promise<AdminRosterWorkbook> {
  const workbook = new ExcelJS.Workbook();
  const buffer = await file.arrayBuffer();
  await workbook.xlsx.load(buffer as never);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) throw new Error('엑셀 시트를 찾을 수 없습니다.');

  const headerRow = worksheet.getRow(1);
  const headers = Array.from(
    { length: Math.max(headerRow.cellCount, worksheet.columnCount) },
    (_, index) => headerRow.getCell(index + 1).text.trim(),
  );
  if (headers.every(header => !header)) {
    throw new Error('첫 번째 행에서 열 이름을 찾을 수 없습니다.');
  }

  const rows: AdminRosterWorkbookRow[] = [];
  for (
    let rowNumber = 2;
    rowNumber <= worksheet.actualRowCount;
    rowNumber += 1
  ) {
    const row = worksheet.getRow(rowNumber);
    const values = headers.map((_, index) =>
      row.getCell(index + 1).text.trim(),
    );
    if (values.some(Boolean)) rows.push({ rowNumber, values });
  }

  return { headers, rows };
}

export function findAdminRosterColumn(
  headers: readonly string[],
  aliases: readonly string[],
) {
  const normalizedAliases = new Set(aliases.map(normalize));
  return headers.flatMap((header, index) =>
    normalizedAliases.has(normalize(header)) ? [index] : [],
  );
}

export function getAdminRosterValue(
  workbook: AdminRosterWorkbook,
  row: AdminRosterWorkbookRow,
  aliases: readonly string[],
) {
  const index = findAdminRosterColumn(workbook.headers, aliases)[0];
  return index === undefined ? '' : (row.values[index] ?? '').trim();
}
