import { loginNotice } from '~/course/loginNotice';

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function dismissalKey(userId: string) {
  return `oop:login-notice:${loginNotice.id}:v${loginNotice.version}:${encodeURIComponent(userId)}`;
}

// Only notice preferences are persisted; no session credentials are stored here.
// Keep the local adapter separate so server persistence can replace it later.
export function isLoginNoticeHidden(userId: string, now = Date.now()) {
  try {
    const hiddenUntil = Number(localStorage.getItem(dismissalKey(userId)));
    return Number.isFinite(hiddenUntil) && hiddenUntil > now;
  } catch {
    return false;
  }
}

export function hideLoginNoticeForWeek(userId: string, now = Date.now()) {
  try {
    localStorage.setItem(dismissalKey(userId), String(now + ONE_WEEK_MS));
    return true;
  } catch {
    return false;
  }
}
