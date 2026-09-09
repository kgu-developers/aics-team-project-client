const timezoneSuffixPattern = /(?:Z|[+-]\d{2}:?\d{2})$/;

export function formatRosterImportAppliedAt(value: string) {
  const instant = timezoneSuffixPattern.test(value) ? value : `${value}Z`;

  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'Asia/Seoul',
  }).format(new Date(instant));
}
