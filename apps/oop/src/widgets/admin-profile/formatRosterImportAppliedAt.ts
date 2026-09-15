const timezoneSuffixPattern = /(?:Z|[+-]\d{2}:?\d{2})$/;
const seoulDateTimeFormatter = new Intl.DateTimeFormat('en-CA', {
  day: 'numeric',
  hour: '2-digit',
  hourCycle: 'h23',
  minute: '2-digit',
  month: 'numeric',
  timeZone: 'Asia/Seoul',
  year: 'numeric',
});

export function formatRosterImportAppliedAt(value: string) {
  const instant = timezoneSuffixPattern.test(value) ? value : `${value}Z`;
  const date = new Date(instant);

  if (Number.isNaN(date.getTime())) return value;

  const parts = Object.fromEntries(
    seoulDateTimeFormatter
      .formatToParts(date)
      .filter(part => part.type !== 'literal')
      .map(part => [part.type, part.value]),
  );
  const hour = Number(parts.hour);
  const period = hour < 12 ? '오전' : '오후';
  const displayHour = hour % 12 || 12;

  return `${parts.year}. ${parts.month}. ${parts.day}. ${period} ${displayHour}:${parts.minute}`;
}
