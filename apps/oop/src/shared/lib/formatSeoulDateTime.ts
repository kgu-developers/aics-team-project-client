import { seoulInstant } from './seoulInstant';

const seoulDateTimeFormatter = new Intl.DateTimeFormat('en-CA', {
  day: '2-digit',
  hour: '2-digit',
  hourCycle: 'h23',
  minute: '2-digit',
  month: '2-digit',
  timeZone: 'Asia/Seoul',
  year: 'numeric',
});

function displayInstant(value: string) {
  const normalized = value.trim().replace(' ', 'T');
  const offsetlessDateTime =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/i.test(normalized);
  return offsetlessDateTime
    ? Date.parse(`${normalized}Z`)
    : seoulInstant(value);
}

/** Formats server timestamps in Asia/Seoul, adding +9h to zone-less date-times. */
export function formatSeoulDateTime(value: string) {
  const date = new Date(displayInstant(value));

  if (Number.isNaN(date.getTime())) return value;

  const parts = Object.fromEntries(
    seoulDateTimeFormatter
      .formatToParts(date)
      .filter(part => part.type !== 'literal')
      .map(part => [part.type, part.value]),
  );

  return `${parts.year}-${parts.month}-${parts.day}/${parts.hour}:${parts.minute}`;
}
