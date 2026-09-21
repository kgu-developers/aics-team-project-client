import { seoulInstant } from './seoulInstant';

const courseScheduleFormatter = new Intl.DateTimeFormat('en-CA', {
  day: '2-digit',
  hour: '2-digit',
  hourCycle: 'h23',
  minute: '2-digit',
  month: '2-digit',
  timeZone: 'Asia/Seoul',
  year: 'numeric',
});

/** Formats course schedule LocalDateTime values as Asia/Seoul wall-clock time. */
export function formatCourseScheduleDateTime(value: string) {
  const date = new Date(seoulInstant(value));
  if (Number.isNaN(date.getTime())) return value;

  const parts = Object.fromEntries(
    courseScheduleFormatter
      .formatToParts(date)
      .filter(part => part.type !== 'literal')
      .map(part => [part.type, part.value]),
  );

  return `${parts.year}-${parts.month}-${parts.day}/${parts.hour}:${parts.minute}`;
}
