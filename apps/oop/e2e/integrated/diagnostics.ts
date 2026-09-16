export type RequestEvidence = {
  stage: string;
  actor: string;
  method: string;
  path: string;
};
export type ResponseEvidence = RequestEvidence & { status: number };
export type ConsoleEvidence = {
  stage: string;
  actor: string;
  message: string;
  path: string;
};

export function consoleResourcePath(url: string) {
  try {
    return new URL(url).pathname;
  } catch {
    return '';
  }
}

export function unversionedApiRequests(requests: RequestEvidence[]) {
  return requests.filter(
    request =>
      request.path.startsWith('/api/') && !request.path.startsWith('/api/v1/'),
  );
}

// Intentional resource failures observed in the integrated workflow's history.
// A generic 403/404, failed vote, missing submission metadata or React error is
// not an exemption. Match the browser resource error to its response evidence.
function expectedResource(response: ResponseEvidence) {
  const { stage, actor, method, path, status } = response;
  if (
    method === 'POST' &&
    path === '/api/v1/oop/auth/refresh' &&
    status === 403
  )
    return true; // Initial anonymous session restoration before login.
  if (method !== 'GET') return false;
  if (path === '/api/v1/oop/users/me/pre-survey-response')
    return stage === '03' && actor === 'survey' && status === 404;
  if (/^\/api\/v1\/teams\/[1-9]\d*\/project$/.test(path))
    return ['06', '08', '10', '11'].includes(stage) && status === 404;
  if (/^\/api\/v1\/meeting-records\/[1-9]\d*$/.test(path)) {
    if (stage === 'M05' && actor === 'comparisonLeader')
      return status === 403 || status === 404;
    return (
      stage === 'M11' && ['leader', 'memberA'].includes(actor) && status === 404
    );
  }
  return (
    stage === 'M12' &&
    actor === 'admin' &&
    status === 404 &&
    /^\/api\/v1\/admin\/oop\/meeting-records\/[1-9]\d*$/.test(path)
  );
}

export function unexpectedConsoleErrors(
  errors: ConsoleEvidence[],
  network: ResponseEvidence[],
) {
  return errors.filter(error => {
    const match =
      /^Failed to load resource: the server responded with a status of (403|404) \([^)]*\)$/.exec(
        error.message,
      );
    return (
      !match ||
      !network.some(
        response =>
          response.actor === error.actor &&
          response.stage === error.stage &&
          response.path === error.path &&
          response.status === Number(match[1]) &&
          expectedResource(response),
      )
    );
  });
}
