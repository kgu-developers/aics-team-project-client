let accessToken: string | null = null;

export function getApiAccessToken() {
  return accessToken;
}

export function setApiAccessToken(nextAccessToken: string | null) {
  accessToken = nextAccessToken;
}
