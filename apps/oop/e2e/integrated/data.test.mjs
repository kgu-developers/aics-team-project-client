import assert from 'node:assert/strict';
import { test } from 'node:test';

import ExcelJS from 'exceljs';

import { createRun, enrollmentFile, roles } from './data.ts';

test('original and edited meetings have distinct run-owned paragraphs for visible structure assertions', () => {
  const run = createRun();
  const original = run.meetingBody.split('\n');
  const edited = run.meetingEditedBody.split('\n');
  for (const paragraphs of [original, edited]) {
    assert.ok(paragraphs.length >= 2);
    paragraphs.forEach(text =>
      assert.ok(text.trim() && text.includes(run.key)),
    );
  }
  assert.equal(
    new Set([...original, ...edited]).size,
    original.length + edited.length,
  );
});

test('run-owned enrollment names fit the server 32-character limit in the actual uploaded workbook', async () => {
  const run = createRun();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load((await enrollmentFile(run)).buffer);
  const sheet = workbook.getWorksheet('명단');
  assert.equal(sheet.rowCount, 8);
  assert.equal(
    new Set(Object.values(run.users).map(user => user.studentNumber)).size,
    7,
  );
  roles.forEach((role, index) => {
    const name = sheet.getCell(index + 2, 2).value;
    assert.ok(name.startsWith(run.key));
    assert.ok(name.length <= 32, `${role}: enrollment limit`);
    assert.equal(name, run.users[role].name);
  });
});
