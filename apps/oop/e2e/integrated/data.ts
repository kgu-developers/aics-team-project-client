import { Buffer } from 'node:buffer';

import ExcelJS from 'exceljs';

export const roles = [
  'leader',
  'memberA',
  'memberB',
  'memberC',
  'comparisonLeader',
  'comparisonMember',
  'survey',
] as const;
export type Actor = (typeof roles)[number];

export function createRun() {
  const now = new Date();
  const stamp = String(now.getTime());
  const key = `E2E248-${stamp}`;
  const phone = `010${stamp.slice(-8)}`;
  const users = Object.fromEntries(
    roles.map((role, index) => [
      role,
      {
        studentNumber: `248${stamp.slice(-10)}${index}`,
        name: `E2E248 ${role}`,
        email: `${key.toLowerCase()}-${role.toLowerCase()}@example.test`,
        phone,
        // Enrollment import's documented initial password is the supplied phone.
        password: phone,
      },
    ]),
  ) as Record<
    Actor,
    {
      studentNumber: string;
      name: string;
      email: string;
      phone: string;
      password: string;
    }
  >;
  const date = (days: number) =>
    new Date(now.getTime() + days * 86_400_000).toISOString().slice(0, 10);
  return {
    key,
    users,
    course: `OOP 통합 ${key}`,
    section: key,
    team: `통합 팀 ${key}`,
    comparison: `비교 팀 ${key}`,
    title: `도서 관리 ${key}`,
    opened: date(-1),
    due: date(7),
    yesterday: date(-1),
    today: date(0),
    tomorrow: date(1),
    meetingTitle: `통합 회의 ${key}`,
  };
}
export type Run = ReturnType<typeof createRun>;

async function spreadsheet(name: string, rows: string[][]) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('명단');
  sheet.addRows(rows);
  sheet.columns.forEach(column => {
    column.width = 25;
    column.numFmt = '@';
  });
  return {
    name,
    mimeType:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer: Buffer.from(await workbook.xlsx.writeBuffer()),
  };
}

export function enrollmentFile(run: Run) {
  return spreadsheet(`${run.key}-students.xlsx`, [
    ['학번', '이름', '이메일', '연락처', '역할'],
    ...roles.map(role => {
      const user = run.users[role];
      return [user.studentNumber, user.name, user.email, user.phone, 'STUDENT'];
    }),
  ]);
}

export function teamFile(run: Run) {
  return spreadsheet(`${run.key}-teams.xlsx`, [
    ['팀명', '학번', '이름', '팀장', '역할'],
    ...roles
      .slice(0, 6)
      .map((role, index) => [
        index < 4 ? run.team : run.comparison,
        run.users[role].studentNumber,
        run.users[role].name,
        index === 0 || index === 4 ? 'Y' : '',
        index === 0 || index === 4 ? '팀장' : '개발',
      ]),
  ]);
}
