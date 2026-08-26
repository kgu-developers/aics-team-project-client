export function formatEvaluationRemainingTime(
  closesAt: string,
  now = Date.now(),
) {
  const closesAtTime = Date.parse(closesAt);
  if (!Number.isFinite(closesAtTime)) return null;

  const remainingSeconds = Math.max(0, Math.ceil((closesAtTime - now) / 1000));
  const days = Math.floor(remainingSeconds / 86_400);
  const hours = Math.floor((remainingSeconds % 86_400) / 3_600);
  const minutes = Math.floor((remainingSeconds % 3_600) / 60);
  const seconds = remainingSeconds % 60;
  const time = [hours, minutes, seconds]
    .map(value => String(value).padStart(2, '0'))
    .join(':');

  return days > 0 ? `${days}일 ${time}` : time;
}
