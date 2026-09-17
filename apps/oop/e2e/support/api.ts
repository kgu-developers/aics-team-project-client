import type {
  CurrentUserResponse,
  MeetingRecordDetailResponseDto,
  PeerEvaluationResponseDto,
  ProjectProposalResponse,
  ProposalSectionsResponse,
  ReceivedPreferredPeerRequest,
  SectionResponse,
  StudentMilestoneResponse,
  TeamKickoffResponse,
  TeamMessage,
} from '@aics/core';
import type { BrowserContext, Route } from '@playwright/test';

import { student } from './ui';

export const paths = {
  login: '/api/v1/auth/login',
  refresh: '/api/v1/auth/refresh',
  logout: '/api/v1/auth/logout',
  me: '/api/v1/users/me',
  sections: '/api/v1/sections',
  milestones: '/api/v1/sections/2/milestones',
  project: '/api/v1/teams/7/project',
  proposalSections: '/api/v1/projects/21/proposal/sections',
  proposalComplete: '/api/v1/projects/21/proposal-complete',
  notices: '/api/v1/sections/2/announcements',
  meetings: '/api/v1/teams/7/meeting-records',
  survey: '/api/v1/users/me/pre-survey-response',
  receivedPreferredPeerRequests:
    '/api/v1/sections/2/pre-survey/preferred-peer-requests/received',
  acceptPreferredPeerRequest: (requesterUserId: string) =>
    `/api/v1/sections/2/pre-survey/preferred-peer-requests/received/${requesterUserId}/accept`,
  submitSurvey: '/api/v1/sections/2/pre-survey/responses',
  peerTargets: '/api/v1/peer-evaluation-forms/1/targets',
  peerResponses: '/api/v1/peer-evaluation-forms/1/responses',
};

export function createState() {
  const section: SectionResponse = {
    id: 2,
    code: 'OOP-E2E',
    name: 'E2E 분반',
    classTime: '월요일 10시',
    capacity: 30,
    courseId: 1,
    courseName: '객체지향프로그래밍',
    year: 2026,
    semester: 'FALL',
    status: 'ACTIVE',
    contactVisibleFrom: '2020-01-01T00:00:00',
    contactVisibleUntil: '2099-12-31T23:59:59',
  };
  const user: CurrentUserResponse = {
    studentNumber: student.studentNumber,
    name: student.name,
    email: 'student@example.test',
    phone: '010-0000-0000',
    globalRole: 'USER',
    sections: [section],
    teamId: 7,
  };
  const team: TeamKickoffResponse = {
    id: 7,
    name: 'E2E 7팀',
    members: [
      {
        id: 1,
        studentNumber: student.studentNumber,
        name: student.name,
        isLeader: true,
        projectRole: '개발',
      },
      {
        id: 2,
        studentNumber: '20269902',
        name: 'E2E 팀원',
        isLeader: false,
        projectRole: '설계',
      },
    ],
  };
  const project: ProjectProposalResponse = {
    id: 21,
    teamId: 7,
    title: 'E2E 도서 관리',
    description: '도서 대출 서비스',
    goal: '대출과 반납을 관리한다',
    dataConfiguration: [],
    screenConfiguration: [],
    repositoryUrl: null,
    externalLinks: null,
    projectSchedule: '9월 구현',
    proposalCompletedAt: null,
    teamOperation: {
      ...team,
      kickoffRule: '매주 회고',
      meetingSchedule: '금요일 18시',
    },
  };
  const proposalSections: ProposalSectionsResponse = {
    allCompleted: false,
    contents: (['TOPIC', 'DATA', 'SCREEN', 'TEAM_OPERATION'] as const).map(
      section => ({
        section,
        assigneeUserId: null,
        assigneeName: null,
        completed: false,
        completedAt: null,
      }),
    ),
  };
  const milestones: StudentMilestoneResponse[] = [
    { id: 2301, title: '제안서', type: 'PROPOSAL', weekNumber: 3 },
    { id: 2305, title: '상호 평가', type: 'PEER_EVALUATION', weekNumber: 15 },
  ].map(item => ({
    ...item,
    sectionId: 2,
    status: 'PUBLISHED',
    allowResubmissionBeforeDueAt: true,
    schedule: { opensAt: '2020-01-01T00:00:00', dueAt: '2099-12-31T23:59:59' },
  })) as StudentMilestoneResponse[];
  const meetings: MeetingRecordDetailResponseDto[] = [
    {
      id: 19,
      teamId: 7,
      title: 'E2E 진행 점검',
      phase: 'MID_CHECK',
      authorId: student.studentNumber,
      meetingAt: '2026-09-07 09:30',
      location: '301호',
      content: '구현 범위와 역할을 정리했습니다.',
      participantIds: [student.studentNumber, '20269902'],
      createdAt: '2026-09-07 10:00',
      updatedAt: '2026-09-07 10:00',
    },
  ];
  return {
    user,
    sections: [section],
    team,
    project: project as ProjectProposalResponse | null,
    proposalSections,
    milestones,
    meetings,
    teamMessages: [] as TeamMessage[],
    authenticated: false,
    lockOwner: null as string | null,
    survey: null as Record<string, unknown> | null,
    receivedPreferredPeerRequests: [] as ReceivedPreferredPeerRequest[],
    peerResponse: null as PeerEvaluationResponseDto | null,
    peerWindow: 'OPEN',
    notices: [
      {
        id: 1,
        sectionId: 2,
        title: 'E2E 프로젝트 안내',
        content: '분반별 제출 일정을 확인하세요.',
        publishedAt: '2026-09-01T09:00:00',
        attachments: [],
      },
    ],
  };
}

type ApiRequest = {
  method: string;
  path: string;
  body: Record<string, unknown> | null;
  headers: Record<string, string>;
};
type Override = { status: number; body: unknown; remaining: number };

/** Per-test API boundary. No application stores or demo branches are modified. */
export class StudentApi {
  state = createState();
  requests: ApiRequest[] = [];
  unhandled: string[] = [];
  overrides = new Map<string, Override>();

  respond(
    method: string,
    path: string,
    status: number,
    body: unknown,
    times = Infinity,
  ) {
    this.overrides.set(`${method} ${path}`, { status, body, remaining: times });
  }

  async install(context: BrowserContext) {
    await context.route(
      /\/(?:api\/v1|sections|teams|meeting-records|meeting-actions|milestones|submissions|mid-reports|edit-locks|peer-evaluation-forms)(?:\/|\?|$)/,
      route => this.handle(route),
    );
  }

  private async handle(route: Route) {
    const request = route.request();
    if (!['xhr', 'fetch'].includes(request.resourceType()))
      return route.fallback();
    const path = new URL(request.url()).pathname;
    const method = request.method();
    const body = request.postData()
      ? (request.postDataJSON() as Record<string, unknown>)
      : null;
    this.requests.push({
      method,
      path,
      body,
      headers: request.headers(),
    });
    const reply = (value: unknown, status = 200) =>
      route.fulfill({ status, json: value });
    const override = this.overrides.get(`${method} ${path}`);
    if (override && override.remaining-- > 0)
      return reply(override.body, override.status);
    const s = this.state;
    if (path === paths.login && method === 'POST') {
      if (
        body?.studentNumber !== student.studentNumber ||
        body?.password !== student.password
      )
        return reply({ message: '로그인 정보를 다시 확인해 주세요.' }, 401);
      s.authenticated = true;
      return reply({ role: 'STUDENT' });
    }
    if (path === paths.refresh)
      return reply(
        s.authenticated ? { role: 'STUDENT' } : { code: 'UNAUTHORIZED' },
        s.authenticated ? 200 : 401,
      );
    if (path === paths.logout) {
      s.authenticated = false;
      return reply({});
    }
    if (!s.authenticated) return reply({ code: 'UNAUTHORIZED' }, 401);
    if (path === paths.me) return reply(s.user);
    if (path === paths.sections) return reply({ contents: s.sections });
    if (path === '/api/v1/teams/7/kickoff') return reply(s.team);
    if (path === '/api/v1/teams/7/leader-claim' && method === 'POST') {
      s.team.members[0]!.isLeader = true;
      return reply(s.team);
    }
    if (path === paths.survey)
      return reply(s.survey ?? { code: 'NOT_FOUND' }, s.survey ? 200 : 404);
    if (path === paths.receivedPreferredPeerRequests)
      return reply({ contents: s.receivedPreferredPeerRequests });
    const acceptedPreferredPeerRequest = s.receivedPreferredPeerRequests.find(
      request =>
        path === paths.acceptPreferredPeerRequest(request.requesterUserId),
    );
    if (acceptedPreferredPeerRequest && method === 'POST') {
      acceptedPreferredPeerRequest.status = 'ACCEPTED';
      return reply({ contents: s.receivedPreferredPeerRequests });
    }
    if (path === paths.submitSurvey && method === 'POST') {
      s.survey = {
        id: 1,
        sectionId: 2,
        studentNumber: student.studentNumber,
        ...body,
        submittedAt: '2026-09-13T10:00:00',
        createdAt: '2026-09-13T10:00:00',
        updatedAt: '2026-09-13T10:00:00',
      };
      return reply(s.survey, 201);
    }
    if (path === paths.milestones) return reply({ contents: s.milestones });
    if (/^\/api\/v1\/milestones\/\d+\/my-team-submission$/.test(path))
      return reply({
        id: 7001,
        milestoneId: Number(path.split('/').at(-2)),
        teamId: 7,
        status: 'NOT_SUBMITTED',
        currentVersion: 0,
        canSubmitNow: true,
        hasPendingReview: false,
      });
    if (path === paths.notices) return reply({ contents: s.notices });
    if (path === paths.project) {
      if (!s.project) return reply({ code: 'PROJECT_NOT_FOUND' }, 404);
      if (method === 'PUT') Object.assign(s.project, body);
      return reply(s.project);
    }
    if (path === paths.proposalSections)
      return reply({
        ...s.proposalSections,
        allCompleted: s.proposalSections.contents.every(item => item.completed),
      });
    if (path.startsWith(paths.proposalSections + '/') && method === 'PUT') {
      const item = s.proposalSections.contents.find(
        item => item.section === path.split('/').at(-1),
      );
      if (!item) return reply({ code: 'NOT_FOUND' }, 404);
      Object.assign(item, body, {
        completedAt: body?.completed ? '2026-09-13T10:00:00' : null,
      });
      return reply(item);
    }
    if (path === paths.proposalComplete && method === 'PATCH') {
      if (s.project) s.project.proposalCompletedAt = '2026-09-13T10:00:00';
      return reply({});
    }
    if (path === '/api/v1/teams/7/thread')
      return reply({ threadId: 70, teamId: 7, createdAt: '2026-09-01' });
    if (path === '/api/v1/teams/7/messages') {
      if (method === 'POST') {
        const created: TeamMessage = {
          id: 701 + s.teamMessages.length,
          threadId: 70,
          senderId: student.studentNumber,
          senderName: student.name,
          relatedType:
            (body?.relatedType as TeamMessage['relatedType']) ?? 'GENERAL',
          relatedId:
            typeof body?.relatedId === 'number' ? body.relatedId : undefined,
          message: String(body?.message ?? ''),
          createdAt: '2026-09-17T09:30:00+09:00',
          important: false,
          read: false,
        };
        s.teamMessages.push(created);
        return reply(created, 201);
      }
      return reply({
        contents: [...s.teamMessages].reverse(),
        pageable: {
          page: 0,
          size: 100,
          totalElements: s.teamMessages.length,
          totalPages: 1,
          isEnd: true,
        },
      });
    }
    if (/^\/api\/v1\/messages\/\d+\/read$/.test(path) && method === 'PATCH') {
      const message = s.teamMessages.find(
        item => String(item.id) === path.split('/').at(-2),
      );
      if (message) message.read = true;
      return reply({});
    }
    if (path === '/api/v1/teams/7/topic-candidates')
      return reply({ contents: [] });
    if (path === '/api/v1/mid-reports/current')
      return reply({ code: 'NOT_FOUND' }, 404);
    if (path === '/api/v1/edit-locks') {
      if (
        method === 'POST' &&
        s.lockOwner &&
        s.lockOwner !== student.studentNumber
      )
        return reply({ code: 'EDIT_LOCK_CONFLICT' }, 409);
      if (method === 'POST') s.lockOwner = student.studentNumber;
      if (method === 'DELETE') s.lockOwner = null;
      return reply({
        locked: Boolean(s.lockOwner),
        lockedBy: s.lockOwner,
        lockedByName:
          s.lockOwner === student.studentNumber ? student.name : '다른 편집자',
        lockedAt: s.lockOwner ? '2026-09-13 10:00' : null,
      });
    }
    if (path === paths.meetings) {
      if (method === 'POST') {
        const record = {
          ...s.meetings[0],
          ...body,
          id: 20,
          teamId: 7,
          authorId: student.studentNumber,
        } as MeetingRecordDetailResponseDto;
        s.meetings.push(record);
        return reply({ id: record.id }, 201);
      }
      return reply({
        contents: s.meetings.map(record => ({
          ...record,
          participantCount: record.participantIds.length,
        })),
      });
    }
    if (/^\/api\/v1\/meeting-records\/\d+$/.test(path)) {
      const record = s.meetings.find(
        item => String(item.id) === path.split('/').at(-1),
      );
      if (!record) return reply({ code: 'NOT_FOUND' }, 404);
      if (method === 'PATCH') {
        Object.assign(record, body);
        return reply({ id: record.id });
      }
      if (method === 'DELETE') {
        s.meetings = s.meetings.filter(item => item !== record);
        return reply({});
      }
      return reply(record);
    }
    if (
      path === '/api/v1/teams/7/actions' ||
      /^\/api\/v1\/meeting-records\/\d+\/actions$/.test(path)
    )
      return reply({ contents: [] });
    if (path === '/api/v1/sections/2/evaluation-context')
      return reply({
        presentationMilestoneId: null,
        peerEvaluationFormId: '1',
      });
    if (path === paths.peerTargets)
      return reply({
        formId: 1,
        title: '상호평가',
        windowState: s.peerWindow,
        windowMessage: '',
        targets: [{ userId: '20269902', name: 'E2E 팀원', role: '설계' }],
        myResponse: s.peerResponse,
      });
    if (path === paths.peerResponses && method === 'POST') {
      s.peerResponse = {
        ...body,
        id: 1,
        status: body?.submit ? 'SUBMITTED' : 'DRAFT',
        updatedAt: '2026-09-13T10:00:00',
        submittedAt: body?.submit ? '2026-09-13T10:00:00' : null,
      } as PeerEvaluationResponseDto;
      return reply(s.peerResponse);
    }
    this.unhandled.push(`${method} ${path}`);
    return reply({ code: 'UNHANDLED_E2E_API' }, 501);
  }
}
