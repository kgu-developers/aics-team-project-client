import {
  fetchMyTeamMilestoneSubmission,
  fetchStudentSubmission,
  fetchStudentSubmissionVersions,
  fetchStudentSubmissionVersion,
  setApiAccessToken,
} from '@aics/api-client';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { studentMilestoneHandlers } from './studentMilestones';
import { studentSubmissionHandlers } from './studentSubmission';
import { getMockMySections } from '../data/sections';
import { studentMilestoneFixtures } from '../data/studentMilestones';
import { demoAccessToken, demoStudent } from '../data/users';

const server = setupServer(
  ...studentSubmissionHandlers,
  ...studentMilestoneHandlers,
);
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  setApiAccessToken(null);
  server.resetHandlers();
});
afterAll(() => server.close());
const section = getMockMySections(demoStudent.studentNumber, {
  status: 'ACTIVE',
})[0]!;
const milestones = studentMilestoneFixtures(section.id);

describe('학생 제출 브라우저 MSW 계약', () => {
  it.each([
    ['PROPOSAL', 0],
    ['FINAL_REPORT', 1],
    ['PRESENTATION', 2],
  ] as const)(
    '%s의 %s개 버전이 홈·상세·이력에서 일치한다',
    async (type, count) => {
      setApiAccessToken(demoAccessToken);
      const milestone = milestones.find(item => item.type === type)!;
      const mine = await fetchMyTeamMilestoneSubmission(
        String(milestone.id),
        '7',
      );
      const detail = await fetchStudentSubmission(String(mine.id));
      const versions = await fetchStudentSubmissionVersions(String(mine.id));
      expect(detail).toEqual(mine);
      expect(detail.currentVersion).toBe(count);
      expect(versions).toHaveLength(count);
      for (const version of versions) {
        const first = await fetchStudentSubmissionVersion(
          String(mine.id),
          version.version,
        );
        const fresh = await fetchStudentSubmissionVersion(
          String(mine.id),
          version.version,
        );
        expect(first.submittedBy).toEqual(version.submittedBy);
        expect(first.artifacts[0]?.fileId).toBe(version.artifacts[0]?.fileId);
        expect(fresh.artifacts[0]?.downloadUrl).not.toBe(
          first.artifacts[0]?.downloadUrl,
        );
      }
    },
  );
  it.each(['detail', 'versions', 'version'] as const)(
    '%s는 다른 팀의 제출 ID를 거절한다',
    async operation => {
      setApiAccessToken(demoAccessToken);
      const otherId = String(8 * 100000 + milestones[2]!.id);
      const request =
        operation === 'detail'
          ? fetchStudentSubmission(otherId)
          : operation === 'versions'
            ? fetchStudentSubmissionVersions(otherId)
            : fetchStudentSubmissionVersion(otherId, 1);
      await expect(request).rejects.toMatchObject({
        response: { status: 403 },
      });
    },
  );
  it('로그인 없는 조회와 없는 버전을 구분한다', async () => {
    const id = String(7 * 100000 + milestones[2]!.id);
    await expect(fetchStudentSubmission(id)).rejects.toMatchObject({
      response: { status: 401 },
    });
    setApiAccessToken(demoAccessToken);
    await expect(fetchStudentSubmissionVersion(id, 99)).rejects.toMatchObject({
      response: { status: 404 },
    });
  });
});
