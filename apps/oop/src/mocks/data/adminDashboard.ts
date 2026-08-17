import { adminNotices, type AdminNotice } from './adminNotices';

export type DashboardListItem = {
  date: string;
  id?: string;
  section: string;
  title: string;
};

const dashboardNoticeIds = new Set<AdminNotice['id']>(['1', '2', '6']);

export const dashboardSchedules = [
  [
    '1151(월6)',
    '48명 / 7팀',
    '~10/8\n제출 7팀\n회의록 3건',
    '~10/29\n제출 6팀\n회의록 3건',
    '~11/12\n제출 6팀\n회의록 1건',
    '~11/19\n제출 2팀\n회의록 0건',
    '11/27\n시작 전',
    '-',
    '3건',
  ],
  [
    '1152(월7)',
    '46명 / 7팀',
    '~10/8\n제출 7팀\n회의록 4건',
    '~10/29\n제출 6팀\n회의록 3건',
    '~11/12\n제출 6팀\n회의록 2건',
    '~11/19\n제출 4팀\n회의록 1건',
    '11/27\n시작 전',
    '-',
    '4건',
  ],
  [
    '1153(월8)',
    '47명 / 6팀',
    '~10/8\n제출 6팀\n회의록 3건',
    '~10/29\n제출 5팀\n회의록 2건',
    '~11/12\n제출 1팀\n회의록 0건',
    '~11/19\n제출 0팀\n회의록 0건',
    '11/27\n시작 전',
    '-',
    '5건',
  ],
] as const;

export const dashboardNotices = adminNotices.filter(notice =>
  dashboardNoticeIds.has(notice.id),
);

export const dashboardMinutes = [
  {
    date: '2025-12-17',
    section: '1151반-A팀',
    title: '와이어프레임 기획 논의',
  },
  {
    date: '2025-12-17',
    section: '1152반-A팀',
    title: '기획 논의',
  },
  {
    date: '2025-12-15',
    section: '1152반-B팀',
    title: '주제 투표하기',
  },
  {
    date: '2025-12-15',
    section: '1153반-C팀',
    title: '주제 투표하기',
  },
] as const;

export const dashboardInbox = [
  {
    date: '20분 전',
    section: '1152-A팀',
    title: '김민준 교수님, 화면설계서 1차 첨부했는데 확인 부탁드려요!',
  },
  {
    date: '1시간 전',
    section: '1152-B팀',
    title: '이은정 교수님, 회의록을 수정 과정에서 저장됐어요.',
  },
  {
    date: '1시간 전',
    section: '1153-B팀',
    title: '박서연 발표자료 초안 오늘 밤까지 올릴게요.',
  },
] as const;
