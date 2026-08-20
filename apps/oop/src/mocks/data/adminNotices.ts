export const noticeSectionFilters = [
  '전체',
  '1151(월6)',
  '1152(월7)',
  '1153(월8)',
] as const;

export type NoticeSectionFilter = (typeof noticeSectionFilters)[number];

export const adminNotices = [
  {
    date: '2025-12-17',
    id: '1',
    section: '1151(월6)',
    title: '전체 접수 공지',
    writer: '이은정',
  },
  {
    date: '2025-12-17',
    id: '2',
    section: '1152(월7)',
    title: '프로젝트 산출물 제출 안내',
    writer: '이은정',
  },
  {
    date: '2025-12-15',
    id: '3',
    section: '1153(월8)',
    title: '10주차 발표 안내',
    writer: '이은정',
  },
  {
    date: '2025-12-17',
    id: '4',
    section: '1151(월6)',
    title: '전체 접수 공지',
    writer: '이은정',
  },
  {
    date: '2025-12-17',
    id: '5',
    section: '1152(월7)',
    title: '프로젝트 산출물 제출 안내',
    writer: '이은정',
  },
  {
    date: '2025-12-15',
    id: '6',
    section: '1153(월8)',
    title: '기말 필기 시험 접수 공지 (수정 12/16)',
    writer: '이은정',
  },
  {
    date: '2025-12-12',
    id: '7',
    section: '1151(월6)',
    title: '프로젝트 중간 점검 일정 안내',
    writer: '이은정',
  },
  {
    date: '2025-12-10',
    id: '8',
    section: '1152(월7)',
    title: '발표 자료 제출 전 확인 사항',
    writer: '이은정',
  },
  {
    date: '2025-12-08',
    id: '9',
    section: '1153(월8)',
    title: '상호 평가 진행 안내',
    writer: '이은정',
  },
] as const;

export type AdminNotice = (typeof adminNotices)[number];
export type AdminNoticeId = AdminNotice['id'];

export const adminNoticeDetails: Record<
  AdminNoticeId,
  {
    attachment: string;
    content: readonly string[];
    createdAt: string;
  }
> = {
  '1': {
    attachment: '객체지향프로그래밍 전체 접수 안내.pdf',
    content: [
      '객체지향프로그래밍 팀 프로젝트 운영을 위한 전체 접수 일정을 안내합니다.',
      '분반별 제출 일정과 공지사항을 확인해 주세요.',
    ],
    createdAt: '2025-12-17 09:00',
  },
  '2': {
    attachment: '프로젝트 산출물 제출 안내.pdf',
    content: [
      '프로젝트 산출물 제출 전 파일명과 필수 제출 항목을 확인해 주세요.',
      '마감 시각 이후 제출물은 지각으로 표시될 수 있습니다.',
    ],
    createdAt: '2025-12-17 10:30',
  },
  '3': {
    attachment: '객체지향프로그래밍 7조 프로젝트 제안서.pdf',
    content: [
      '10주차 발표에는 코드와 시연 화면, 발표 자료를 준비해 주세요.',
      '발표 점수는 만점 15점이며 발표 수준에 따라 점수를 부여합니다.',
      '발표 자료에는 구현한 화면을 함께 포함해 주세요.',
    ],
    createdAt: '2025-12-15 14:30',
  },
  '4': {
    attachment: '객체지향프로그래밍 전체 접수 안내.pdf',
    content: [
      '전체 접수 공지의 수정 사항을 확인해 주세요.',
      '제출 전 분반과 팀 정보를 다시 확인해 주세요.',
    ],
    createdAt: '2025-12-17 13:00',
  },
  '5': {
    attachment: '프로젝트 산출물 제출 안내.pdf',
    content: [
      '프로젝트 산출물은 제출 기한 내에 업로드해 주세요.',
      '제출 후 파일이 정상적으로 열리는지 확인해 주세요.',
    ],
    createdAt: '2025-12-17 15:00',
  },
  '6': {
    attachment: '기말 필기 시험 접수 공지.pdf',
    content: [
      '기말 필기 시험 접수 일정과 수정된 안내 사항을 확인해 주세요.',
      '접수 대상과 시간을 확인한 뒤 신청해 주세요.',
    ],
    createdAt: '2025-12-15 11:00',
  },
  '7': {
    attachment: '프로젝트 중간 점검 일정.pdf',
    content: [
      '프로젝트 중간 점검 일정과 발표 순서를 안내합니다.',
      '점검 전까지 팀별 진행 상황을 정리해 주세요.',
    ],
    createdAt: '2025-12-12 16:00',
  },
  '8': {
    attachment: '발표 자료 제출 전 확인 사항.pdf',
    content: [
      '발표 자료 제출 전에 파일 형식과 제출 항목을 확인해 주세요.',
      '업로드한 자료는 발표 전까지 수정할 수 있습니다.',
    ],
    createdAt: '2025-12-10 09:30',
  },
  '9': {
    attachment: '상호 평가 진행 안내.pdf',
    content: [
      '상호 평가는 안내된 기간 안에 참여해 주세요.',
      '평가 내용은 팀 프로젝트 운영에 활용됩니다.',
    ],
    createdAt: '2025-12-08 10:00',
  },
};

export const noticeListPageSize = 3;
