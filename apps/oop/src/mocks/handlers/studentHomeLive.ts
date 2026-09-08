import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { http, HttpResponse } from 'msw';

import {
  liveHomeActions,
  liveHomeAnnouncements,
  liveHomeProject,
  liveHomeRecords,
  liveHomeTeam,
  liveHomeUser,
} from '../data/studentHomeLive';

/** Synthetic read-only fixtures for the deployed contract; not enabled in the scenario demo. */
export const studentHomeLiveHandlers = [
  http.get(`${API_BASE_URL}${ENDPOINTS.USER.ME}`, () =>
    HttpResponse.json({
      studentNumber: liveHomeUser.studentNumber,
      name: liveHomeUser.name,
      email: liveHomeUser.email,
      phone: '010-0000-0000',
      globalRole: 'USER',
      sections: [{ id: 2, code: 'OOP-2', name: '테스트 분반' }],
      teamId: 7,
    }),
  ),
  http.get(`${API_BASE_URL}${ENDPOINTS.ANNOUNCEMENTS.SECTION_LIST('2')}`, () =>
    HttpResponse.json({ contents: liveHomeAnnouncements }),
  ),
  http.get(`${API_BASE_URL}${ENDPOINTS.MEETING.RECORDS('7')}`, () =>
    HttpResponse.json({ contents: liveHomeRecords }),
  ),
  http.get(`${API_BASE_URL}${ENDPOINTS.MEETING.ACTIONS('7')}`, () =>
    HttpResponse.json({ contents: liveHomeActions }),
  ),
  http.get(`${API_BASE_URL}${ENDPOINTS.TEAM.KICKOFF('7')}`, () =>
    HttpResponse.json(liveHomeTeam),
  ),
  http.get(`${API_BASE_URL}${ENDPOINTS.PROJECT.BY_TEAM('7')}`, () =>
    HttpResponse.json(liveHomeProject),
  ),
];
