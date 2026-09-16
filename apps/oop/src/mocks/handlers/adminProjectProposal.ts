import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { http, HttpResponse } from 'msw';

import { getMockAuthenticatedAccount } from '../authSession';
import {
  adminStudentsFixture,
  adminTeamsFixture,
} from '../data/adminStudentTeams';
import { createProjectProposalFixture } from '../data/projectProposal';

function projectForAdminTeam(teamId: number) {
  const project = createProjectProposalFixture();
  const team = adminTeamsFixture.find(
    candidate => Number(candidate.id.split('-').at(-1)) === teamId,
  );

  return {
    ...project,
    id: 1_000 + teamId,
    teamId,
    teamOperation: {
      ...project.teamOperation,
      id: teamId,
      members:
        team?.memberIds.flatMap(memberId => {
          const member = adminStudentsFixture.find(
            student => student.id === memberId,
          );
          if (!member) return [];

          return [
            {
              id: Number(member.id.split('-').at(-1)) || 0,
              isLeader: member.isLeader,
              name: member.name,
              projectRole: member.isLeader ? '팀장' : '팀원',
              studentNumber: member.studentNumber,
            },
          ];
        }) ?? [],
      name: team?.name ?? `${teamId}팀`,
    },
  };
}

/**
 * The project endpoint is shared by student and instructor screens. The
 * meeting fixture only recognizes the student demo team (7), so admin
 * submission details need their own section-scoped projection first.
 */
export const adminProjectProposalHandlers = [
  http.get(
    `${API_BASE_URL}${ENDPOINTS.PROJECT.BY_TEAM(':teamId')}`,
    ({ params, request }) => {
      const account = getMockAuthenticatedAccount(request);
      const teamId = Number(params.teamId);

      if (!account) {
        return HttpResponse.json({ code: 'UNAUTHORIZED' }, { status: 401 });
      }
      if (account.user.globalRole === 'STUDENT') {
        // Let the student-specific handler below this one own student requests.
        return;
      }
      if (
        !Number.isSafeInteger(teamId) ||
        !adminTeamsFixture.some(
          team => Number(team.id.split('-').at(-1)) === teamId,
        ) ||
        !account.user.sections.some(section => String(section.id) === '1')
      ) {
        return HttpResponse.json(
          { code: 'PROJECT_NOT_FOUND' },
          { status: 404 },
        );
      }

      return HttpResponse.json(projectForAdminTeam(teamId));
    },
  ),
];
