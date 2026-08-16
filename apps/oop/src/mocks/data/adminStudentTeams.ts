export type AdminSectionFixture = {
  id: string;
  displayName: string;
};

export type AdminStudentFixture = {
  id: string;
  name: string;
  studentNumber: string;
  major: string;
  sectionId: string;
  teamId: string | null;
};

export type AdminTeamFixture = {
  id: string;
  name: string;
  sectionId: string;
  memberIds: string[];
};

export const adminSectionsFixture: AdminSectionFixture[] = [
  { id: '1151', displayName: '1151 (월6)' },
  { id: '1152', displayName: '1152 (월7)' },
  { id: '1153', displayName: '1153 (월8)' },
];

export const adminStudentsFixture: AdminStudentFixture[] = [
  {
    id: 'student-1151-1',
    name: '김민준',
    studentNumber: '20231234',
    major: '컴퓨터공학과',
    sectionId: '1151',
    teamId: 'team-1151-1',
  },
  {
    id: 'student-1151-2',
    name: '이서연',
    studentNumber: '20235678',
    major: '소프트웨어학과',
    sectionId: '1151',
    teamId: 'team-1151-1',
  },
  {
    id: 'student-1151-3',
    name: '박지훈',
    studentNumber: '20239876',
    major: '컴퓨터공학과',
    sectionId: '1151',
    teamId: 'team-1151-2',
  },
  {
    id: 'student-1151-4',
    name: '최유진',
    studentNumber: '20234567',
    major: '인공지능학과',
    sectionId: '1151',
    teamId: 'team-1151-2',
  },
  {
    id: 'student-1152-1',
    name: '정도현',
    studentNumber: '20230124',
    major: '컴퓨터공학과',
    sectionId: '1152',
    teamId: 'team-1152-1',
  },
  {
    id: 'student-1152-2',
    name: '한지민',
    studentNumber: '20238901',
    major: '소프트웨어학과',
    sectionId: '1152',
    teamId: 'team-1152-1',
  },
  {
    id: 'student-1153-1',
    name: '오세훈',
    studentNumber: '20236789',
    major: '데이터사이언스학과',
    sectionId: '1153',
    teamId: 'team-1153-1',
  },
  {
    id: 'student-1153-2',
    name: '윤하늘',
    studentNumber: '20239012',
    major: '인공지능학과',
    sectionId: '1153',
    teamId: 'team-1153-1',
  },
];

export const adminTeamsFixture: AdminTeamFixture[] = [
  {
    id: 'team-1151-1',
    name: '1팀',
    sectionId: '1151',
    memberIds: ['student-1151-1', 'student-1151-2'],
  },
  {
    id: 'team-1151-2',
    name: '2팀',
    sectionId: '1151',
    memberIds: ['student-1151-3', 'student-1151-4'],
  },
  {
    id: 'team-1152-1',
    name: '1팀',
    sectionId: '1152',
    memberIds: ['student-1152-1', 'student-1152-2'],
  },
  {
    id: 'team-1153-1',
    name: '1팀',
    sectionId: '1153',
    memberIds: ['student-1153-1', 'student-1153-2'],
  },
];
