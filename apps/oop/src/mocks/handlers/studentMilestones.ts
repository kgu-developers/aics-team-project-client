import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { http, HttpResponse } from 'msw';

import { getMockAuthenticatedAccount } from '../authSession';
import { getMockMySections } from '../data/sections';
import { studentMilestoneFixtures } from '../data/studentMilestones';
import { studentSubmissionFixture } from '../data/studentSubmission';

export const studentMilestoneHandlers = [
  http.get(
    `${API_BASE_URL}${ENDPOINTS.STUDENT_MILESTONE.LIST(':sectionId')}`,
    ({ request, params }) => {
      const account = getMockAuthenticatedAccount(request);
      if (!account) return new HttpResponse(null, { status: 401 });
      const sectionId = Number(params.sectionId);
      if (!Number.isSafeInteger(sectionId) || sectionId <= 0)
        return new HttpResponse(null, { status: 400 });
      const sections = getMockMySections(account.credentials.studentNumber, {
        status: 'ACTIVE',
      });
      if (!sections.some(section => section.id === sectionId))
        return new HttpResponse(null, { status: 403 });
      return HttpResponse.json({
        contents: studentMilestoneFixtures(sectionId),
      });
    },
  ),
  http.get(
    `${API_BASE_URL}${ENDPOINTS.STUDENT_MILESTONE.MY_TEAM_SUBMISSION(':milestoneId')}`,
    ({ request, params }) => {
      const account = getMockAuthenticatedAccount(request);
      if (!account) return new HttpResponse(null, { status: 401 });
      const milestoneId = Number(params.milestoneId);
      const sections = getMockMySections(account.credentials.studentNumber, {
        status: 'ACTIVE',
      });
      if (
        !sections.some(section =>
          studentMilestoneFixtures(section.id).some(
            item => item.id === milestoneId,
          ),
        )
      )
        return new HttpResponse(null, { status: 404 });
      const teamId = Number(account.user.currentTeam?.id.replace(/^team-/, ''));
      if (!Number.isSafeInteger(teamId) || teamId <= 0)
        return new HttpResponse(null, { status: 403 });
      const milestone = sections
        .flatMap(section => studentMilestoneFixtures(section.id))
        .find(item => item.id === milestoneId)!;
      return HttpResponse.json(studentSubmissionFixture(milestone, teamId));
    },
  ),
];
