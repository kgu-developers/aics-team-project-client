export function formatTeamAssignmentDate(isoDate?: string) {
  if (!isoDate) {
    return '안내 예정';
  }

  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return '안내 예정';
  }

  return new Intl.DateTimeFormat('ko-KR', {
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    month: 'long',
    timeZone: 'Asia/Seoul',
    year: 'numeric',
  }).format(date);
}
