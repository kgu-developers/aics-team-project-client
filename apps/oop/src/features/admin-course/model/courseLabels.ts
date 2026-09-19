import type {
  AdminOopCourseSemester,
  AdminOopCourseStatus,
} from '@aics/api-client';

import { seoulInstant } from '~/shared/lib/seoulInstant';

export const semesterOptions: {
  label: string;
  value: AdminOopCourseSemester;
}[] = [
  { label: '1학기', value: 'SPRING' },
  { label: '여름학기', value: 'SUMMER' },
  { label: '2학기', value: 'FALL' },
  { label: '겨울학기', value: 'WINTER' },
];

export const statusOptions: { label: string; value: AdminOopCourseStatus }[] =
  [
    { label: '임시 저장', value: 'DRAFT' },
    { label: '운영 중', value: 'ACTIVE' },
    { label: '보관됨', value: 'ARCHIVED' },
  ];

export function semesterLabel(value: AdminOopCourseSemester) {
  return semesterOptions.find(option => option.value === value)?.label ?? value;
}

export function statusLabel(value: AdminOopCourseStatus) {
  return statusOptions.find(option => option.value === value)?.label ?? value;
}

/** Badge tone for a course status. */
export function statusBadgeVariant(
  value: AdminOopCourseStatus,
): 'info' | 'neutral' | 'success' {
  if (value === 'ACTIVE') return 'success';
  if (value === 'DRAFT') return 'info';
  return 'neutral';
}

export type ContactVisibilityStatus =
  | '미설정'
  | '입력 확인 필요'
  | '공개 예정'
  | '공개 중'
  | '공개 종료';

export function contactVisibilityStatus(
  visibleFrom: string | null | undefined,
  visibleUntil: string | null | undefined,
  now = Date.now(),
): ContactVisibilityStatus {
  if (!visibleFrom && !visibleUntil) return '미설정';

  const startsAt = seoulInstant(visibleFrom);
  const endsAt = seoulInstant(visibleUntil);
  if (Number.isNaN(startsAt) || Number.isNaN(endsAt) || startsAt >= endsAt) {
    return '입력 확인 필요';
  }

  if (now < startsAt) return '공개 예정';
  if (now <= endsAt) return '공개 중';
  return '공개 종료';
}

export function contactVisibilityBadgeVariant(
  status: ContactVisibilityStatus,
): 'error' | 'info' | 'neutral' | 'success' {
  switch (status) {
    case '공개 중':
      return 'success';
    case '공개 예정':
      return 'info';
    case '입력 확인 필요':
      return 'error';
    default:
      return 'neutral';
  }
}
