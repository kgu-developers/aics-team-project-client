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
function expectedResource(
  response: ResponseEvidence,
  network: ResponseEvidence[],
) {
  const { stage, actor, method, path, status } = response;
  if (
    method === 'POST' &&
    path === '/api/v1/auth/refresh' &&
    (status === 401 || status === 403)
  )
    // Each actor starts in a fresh context. The app and API client can each
    // attempt anonymous restoration, yielding a 403 then a 401. Only failures
    // before that actor's first successful login/refresh are expected.
    {
      const responseIndex = network.indexOf(response);
      const hadAuthenticatedSession = network
        .slice(0, responseIndex)
        .some(
          item =>
            item.actor === actor &&
            ((item.path === '/api/v1/auth/login' && item.status === 200) ||
              (item.path === '/api/v1/auth/refresh' && item.status === 200)),
        );
      if (!hadAuthenticatedSession) return true;

      // A stale admin page can redirect to /login between the stage-level
      // preflight and its first navigation. Accept only the bounded anonymous
      // refresh chain that is immediately completed by a successful login in
      // that same stage; an unrecovered or post-login 401 remains unexpected.
      for (const item of network.slice(responseIndex + 1)) {
        if (item.stage !== stage || item.actor !== actor) continue;
        if (
          item.method === 'POST' &&
          item.path === '/api/v1/auth/login' &&
          item.status === 200
        )
          return true;
        if (
          item.method === 'POST' &&
          item.path === '/api/v1/auth/refresh' &&
          (item.status === 401 || item.status === 403)
        )
          continue;
        return false;
      }
      return false;
    }
  if (method !== 'GET') return false;
  // Deployed contract mismatch: listed version values 9/19 returned 404 in
  // stage 10, including the earlier /admin/oop run. Keep other reads strict.
  if (
    /^\/api\/v1\/admin\/submissions\/[1-9]\d*\/versions\/[1-9]\d*$/.test(path)
  )
    return stage === '10' && actor === 'admin' && status === 404;
  if (path === '/api/v1/users/me/pre-survey-response')
    return stage === '03' && actor === 'survey' && status === 404;
  if (path === '/api/v1/mid-reports/current')
    return (
      stage === '06' &&
      ['leader', 'memberA', 'memberB', 'memberC'].includes(actor) &&
      status === 404
    );
  if (/^\/api\/v1\/teams\/[1-9]\d*\/project$/.test(path)) {
    if (stage === '18' && actor === 'admin' && status === 404) {
      const responseIndex = network.indexOf(response);
      const missingTeamId = path.split('/')[4];
      const loadedPeerEvaluationList = network
        .slice(0, responseIndex)
        .some(
          item =>
            item.stage === stage &&
            item.actor === actor &&
            item.method === 'GET' &&
            item.status === 200 &&
            /^\/api\/v1\/admin\/sections\/[1-9]\d*\/peer-evaluations$/.test(
              item.path,
            ),
        );
      const loadedDifferentProject = network
        .slice(responseIndex + 1)
        .some(
          item =>
            item.stage === stage &&
            item.actor === actor &&
            item.method === 'GET' &&
            item.status === 200 &&
            /^\/api\/v1\/teams\/[1-9]\d*\/project$/.test(item.path) &&
            item.path.split('/')[4] !== missingTeamId,
        );
      if (loadedPeerEvaluationList && loadedDifferentProject) return true;
    }
    return (
      status === 404 &&
      (['06', '08', '10', '11'].includes(stage) ||
        // memberC's absent-project read can finish after 06 fails.
        (stage === 'M01' && actor === 'memberC'))
    );
  }
  if (/^\/api\/v1\/meeting-records\/[1-9]\d*$/.test(path)) {
    if (stage === 'M05' && actor === 'comparisonLeader')
      return status === 403 || status === 404;
    if (stage === 'M10' && actor === 'leader' && status === 404)
      // The deleted detail can refetch before navigation leaves stage M10.
      return network
        .slice(0, network.indexOf(response))
        .some(
          item =>
            item.stage === stage &&
            item.actor === actor &&
            item.method === 'DELETE' &&
            item.path === path &&
            item.status === 204,
        );
    return (
      stage === 'M11' && ['leader', 'memberA'].includes(actor) && status === 404
    );
  }
  return (
    stage === 'M12' &&
    actor === 'admin' &&
    status === 404 &&
    /^\/api\/v1\/admin\/meeting-records\/[1-9]\d*$/.test(path)
  );
}

export function unexpectedConsoleErrors(
  errors: ConsoleEvidence[],
  network: ResponseEvidence[],
) {
  const matchedResponses = new Set<ResponseEvidence>();
  return errors.filter(error => {
    const match =
      /^Failed to load resource: the server responded with a status of (401|403|404) \([^)]*\)$/.exec(
        error.message,
      );
    if (!match) return true;
    const response = network.find(
      response =>
        !matchedResponses.has(response) &&
        response.actor === error.actor &&
        response.stage === error.stage &&
        response.path === error.path &&
        response.status === Number(match[1]),
    );
    if (!response) return true;
    matchedResponses.add(response);
    return !expectedResource(response, network);
  });
}
