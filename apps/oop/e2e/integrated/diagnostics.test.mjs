import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  consoleResourcePath,
  unexpectedConsoleErrors,
  unversionedApiRequests,
} from './diagnostics.ts';

test('console location keeps only the path and handles missing/non-URL locations', () => {
  assert.equal(
    consoleResourcePath(
      'https://example.invalid/api/v1/meeting-records/12?token=synthetic#fragment',
    ),
    '/api/v1/meeting-records/12',
  );
  assert.equal(consoleResourcePath(''), '');
  assert.equal(consoleResourcePath('<anonymous>'), '');
});

const response = {
  stage: 'M05',
  actor: 'comparisonLeader',
  method: 'GET',
  path: '/api/v1/meeting-records/12',
  status: 403,
};
const consoleError = (item = response) => ({
  stage: item.stage,
  actor: item.actor,
  path: item.path,
  message: `Failed to load resource: the server responded with a status of ${item.status} (Resource error)`,
});

test('rejects every unversioned /api/ request, including requests without a response', () => {
  const paths = [
    '/api/notices',
    '/api/v2/notices',
    '/api/v10/notices',
    '/api/v1',
    '/api/v1/notices',
    '/admin/notices',
  ];
  const requests = paths.map(path => ({ ...response, path }));
  assert.deepEqual(
    unversionedApiRequests(requests).map(item => item.path),
    paths.slice(0, 4),
  );
});

test('allows only intentional resource errors matched to response method/path/status/stage/actor', () => {
  const network = [
    response,
    {
      ...response,
      stage: '03',
      actor: 'survey',
      path: '/api/v1/users/me/pre-survey-response',
      status: 404,
    },
    {
      ...response,
      stage: '06',
      actor: 'leader',
      path: '/api/v1/teams/1/project',
      status: 404,
    },
    { ...response, stage: 'M11', actor: 'memberA', status: 404 },
    {
      ...response,
      stage: 'M12',
      actor: 'admin',
      path: '/api/v1/admin/meeting-records/12',
      status: 404,
    },
  ];
  assert.deepEqual(
    unexpectedConsoleErrors(network.map(consoleError), network),
    [],
  );
  for (const changed of [
    { actor: 'admin' },
    { stage: 'M01' },
    { path: '' },
    { path: '/api/v1/meeting-records/99' },
  ]) {
    const error = { ...consoleError(), ...changed };
    assert.deepEqual(unexpectedConsoleErrors([error], network), [error]);
  }
  assert.deepEqual(
    unexpectedConsoleErrors(
      [consoleError()],
      [{ ...response, method: 'PATCH' }],
    ),
    [consoleError()],
  );
});

for (const { intended, rejected } of [
  {
    intended: {
      stage: '03',
      actor: 'survey',
      method: 'GET',
      path: '/api/v1/users/me/pre-survey-response',
      status: 404,
    },
    rejected: [
      { stage: '04' },
      { actor: 'leader' },
      { path: '/api/v1/oop/users/me/pre-survey-response' },
      { path: '/api/v1/users/me/pre-survey-response/extra' },
      { path: '/api/v1/users/me/pre-survey-response/' },
    ],
  },
  {
    intended: {
      stage: 'M12',
      actor: 'admin',
      method: 'GET',
      path: '/api/v1/admin/meeting-records/12',
      status: 404,
    },
    rejected: [
      { stage: 'M11' },
      { actor: 'leader' },
      { path: '/api/v1/admin/oop/meeting-records/12' },
      { path: '/api/v1/meeting-records/12' },
      { path: '/api/v1/admin/meeting-records/12/actions' },
      { path: '/api/v1/admin/meeting-records/12/' },
      { path: '/api/v1/admin/meeting-records/0' },
      { path: '/api/v1/admin/meeting-records/012' },
    ],
  },
]) {
  test(`allows only the intended ${intended.stage} ${intended.path} GET 404`, () => {
    assert.deepEqual(
      unexpectedConsoleErrors([consoleError(intended)], [intended]),
      [],
    );
    for (const changed of [
      ...rejected,
      { method: 'POST' },
      { status: 403 },
      { status: 500 },
    ]) {
      const unexpected = { ...intended, ...changed };
      const error = consoleError(unexpected);
      assert.deepEqual(unexpectedConsoleErrors([error], [unexpected]), [error]);
    }
  });
}

test('allows only memberC delayed M01 absent-project GET 404 outside existing project stages', () => {
  const delayed = {
    stage: 'M01',
    actor: 'memberC',
    method: 'GET',
    path: '/api/v1/teams/60/project',
    status: 404,
  };
  const network = [
    delayed,
    ...['06', '08', '10', '11'].map(stage => ({
      ...delayed,
      stage,
      actor: 'leader',
    })),
  ];
  assert.deepEqual(
    unexpectedConsoleErrors(network.map(consoleError), network),
    [],
  );
  for (const changed of [
    ...[
      'admin',
      'leader',
      'memberA',
      'memberB',
      'survey',
      'comparisonLeader',
    ].map(actor => ({ actor })),
    { stage: 'M02' },
    { stage: 'N01' },
    { stage: '07' },
    { method: 'POST' },
    { status: 403 },
    { status: 500 },
    { path: '/api/v1/teams/60/thread' },
    { path: '/api/v1/oop/teams/60/project' },
    { path: '/api/v1/teams/60/project/extra' },
    { path: '/api/v1/teams/60/project/' },
    { path: '/api/v1/teams/0/project' },
    { path: '/api/v1/teams/060/project' },
  ]) {
    const unexpected = { ...delayed, ...changed };
    const error = consoleError(unexpected);
    assert.deepEqual(unexpectedConsoleErrors([error], [unexpected]), [error]);
  }
});

test('allows only stage 10 admin version-detail GET 404s with exact positive numeric IDs', () => {
  const detail = {
    stage: '10',
    actor: 'admin',
    method: 'GET',
    path: '/api/v1/admin/submissions/251/versions/9',
    status: 404,
  };
  const network = [
    detail,
    { ...detail, path: '/api/v1/admin/submissions/251/versions/19' },
  ];
  assert.deepEqual(
    unexpectedConsoleErrors(network.map(consoleError), network),
    [],
  );
  for (const changed of [
    ...[
      'leader',
      'memberA',
      'memberB',
      'memberC',
      'survey',
      'comparisonLeader',
      '',
    ].map(actor => ({ actor })),
    ...['09', '11', '12', 'N01', '010', ''].map(stage => ({ stage })),
    ...['POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'get'].map(method => ({
      method,
    })),
    ...[200, 400, 401, 403, 500].map(status => ({ status })),
    ...[
      '/api/v1/admin/oop/submissions/251/versions/9',
      '/api/v1/submissions/251/versions/9',
      '/api/admin/submissions/251/versions/9',
      '/api/v1/admin/submissions/251/versions',
      '/api/v1/admin/submissions/251/versions/9/',
      '/api/v1/admin/submissions/251/versions/9/extra',
      '/api/v1/admin/submissions/251/versions/9?extra=1',
      '/prefix/api/v1/admin/submissions/251/versions/9',
      ...['0', '-1', '01', '1.5', 'one', ''].flatMap(id => [
        `/api/v1/admin/submissions/${id}/versions/9`,
        `/api/v1/admin/submissions/251/versions/${id}`,
      ]),
    ].map(path => ({ path })),
  ]) {
    const unexpected = { ...detail, ...changed };
    const error = consoleError(unexpected);
    assert.deepEqual(
      unexpectedConsoleErrors([error], [unexpected]),
      [error],
      JSON.stringify(changed),
    );
  }
  for (const changed of [
    { actor: 'leader' },
    { stage: '11' },
    { path: '/api/v1/admin/submissions/251/versions/19' },
    { status: 403 },
  ]) {
    const error = consoleError({ ...detail, ...changed });
    assert.deepEqual(unexpectedConsoleErrors([error], [detail]), [error]);
  }
  assert.deepEqual(unexpectedConsoleErrors([consoleError(detail)], []), [
    consoleError(detail),
  ]);
  assert.deepEqual(
    unexpectedConsoleErrors(
      [consoleError(detail), consoleError(detail)],
      [detail],
    ),
    [consoleError(detail)],
  );
  const reactError = {
    ...consoleError(detail),
    message: 'In HTML, <form> cannot be a descendant of <form>.',
  };
  assert.deepEqual(unexpectedConsoleErrors([reactError], network), [
    reactError,
  ]);
});

const deletedMeeting = {
  stage: 'M10',
  actor: 'leader',
  method: 'GET',
  path: '/api/v1/meeting-records/17',
  status: 404,
};
const meetingDelete = { ...deletedMeeting, method: 'DELETE', status: 204 };

test('allows the M10 leader missing detail only after its matching DELETE 204', () => {
  assert.deepEqual(
    unexpectedConsoleErrors(
      [consoleError(deletedMeeting)],
      [meetingDelete, deletedMeeting],
    ),
    [],
  );
  for (const network of [
    [],
    [meetingDelete],
    [deletedMeeting],
    [deletedMeeting, meetingDelete],
    ...[
      { stage: 'M09' },
      { actor: 'memberA' },
      { method: 'GET' },
      { status: 200 },
      { status: 202 },
      { status: 404 },
      { status: 500 },
      { path: '/api/v1/meeting-records/18' },
      { path: '/api/v1/admin/meeting-records/17' },
      { path: '/api/v1/meeting-records/17/actions' },
    ].map(changed => [{ ...meetingDelete, ...changed }, deletedMeeting]),
  ]) {
    const error = consoleError(deletedMeeting);
    assert.deepEqual(unexpectedConsoleErrors([error], network), [error]);
  }
});

test('keeps M10 post-delete exceptions scoped to leader GET 404 on exact positive meeting IDs', () => {
  for (const changed of [
    ...['M09', 'M01', 'N01', '10', ''].map(stage => ({ stage })),
    ...['admin', 'memberA', 'comparisonLeader', ''].map(actor => ({ actor })),
    ...['POST', 'PATCH', 'DELETE', 'HEAD', 'get'].map(method => ({ method })),
    ...[200, 403, 500].map(status => ({ status })),
    ...[
      '/api/v1/admin/meeting-records/17',
      '/api/v1/oop/meeting-records/17',
      '/api/v1/meeting-records/17/actions',
      '/api/v1/meeting-records/17/',
      '/api/v1/meeting-records/17?extra=1',
      '/prefix/api/v1/meeting-records/17',
      ...['0', '-1', '017', '1.5', 'one', ''].map(
        id => `/api/v1/meeting-records/${id}`,
      ),
    ].map(path => ({ path })),
  ]) {
    const unexpected = { ...deletedMeeting, ...changed };
    const priorDelete = { ...unexpected, method: 'DELETE', status: 204 };
    const error = consoleError(unexpected);
    assert.deepEqual(
      unexpectedConsoleErrors([error], [priorDelete, unexpected]),
      [error],
      JSON.stringify(changed),
    );
  }
});

test('consumes each M10 missing response once and checks DELETE order for each response', () => {
  const error = consoleError(deletedMeeting);
  assert.deepEqual(
    unexpectedConsoleErrors([error, error], [meetingDelete, deletedMeeting]),
    [error],
  );
  const secondMissing = { ...deletedMeeting };
  assert.deepEqual(
    unexpectedConsoleErrors(
      [error, error],
      [meetingDelete, deletedMeeting, secondMissing],
    ),
    [],
  );
  assert.deepEqual(
    unexpectedConsoleErrors(
      [error, error],
      [deletedMeeting, meetingDelete, secondMissing],
    ),
    [error],
  );
});

test('keeps the stage 06 backend thread 500 and later thread failures unexpected even after successful reads', () => {
  const network = ['06', 'M01'].flatMap(stage =>
    ['leader', 'memberA', 'memberB', 'memberC'].map(actor => ({
      stage,
      actor,
      method: 'GET',
      path: '/api/v1/teams/60/thread',
      status: 500,
    })),
  );
  const errors = network.map(consoleError);
  const withRecovery = network.flatMap(item => [
    item,
    { ...item, status: 200 },
    { ...item, status: 200 },
  ]);
  assert.deepEqual(unexpectedConsoleErrors(errors, withRecovery), errors);
});

test('allows only the exact initial anonymous refresh 401/403 for each fresh actor', () => {
  const refresh = {
    stage: '01',
    actor: 'admin',
    method: 'POST',
    path: '/api/v1/auth/refresh',
    status: 403,
  };
  const login = { ...refresh, path: '/api/v1/auth/login', status: 200 };
  const studentRefresh = { ...refresh, stage: '03', actor: 'survey' };
  const network = [refresh, login, studentRefresh];
  assert.deepEqual(
    unexpectedConsoleErrors(
      [consoleError(refresh), consoleError(studentRefresh)],
      network,
    ),
    [],
  );
  const unauthorizedRefresh = { ...refresh, status: 401 };
  assert.deepEqual(
    unexpectedConsoleErrors(
      [consoleError(unauthorizedRefresh)],
      [unauthorizedRefresh],
    ),
    [],
  );
  const chainedUnauthorized = { ...unauthorizedRefresh };
  assert.deepEqual(
    unexpectedConsoleErrors(
      [consoleError(refresh), consoleError(chainedUnauthorized)],
      [refresh, chainedUnauthorized, login],
    ),
    [],
  );
  for (const changed of [
    { method: 'GET' },
    { path: '/api/v1/oop/auth/refresh' },
    { path: '/api/v1/auth/refresh/extra' },
    { path: '/api/v1/admin/courses' },
    { status: 404 },
    { status: 500 },
  ]) {
    const unexpected = { ...refresh, ...changed };
    const error = consoleError(unexpected);
    assert.deepEqual(unexpectedConsoleErrors([error], [unexpected]), [error]);
  }
  for (const changed of [{ actor: 'survey' }, { stage: '02' }]) {
    const error = { ...consoleError(refresh), ...changed };
    assert.deepEqual(unexpectedConsoleErrors([error], [refresh]), [error]);
  }
  for (const prior of [login, { ...refresh, status: 200 }]) {
    const error = consoleError(refresh);
    assert.deepEqual(unexpectedConsoleErrors([error], [prior, refresh]), [
      error,
    ]);
  }
  const laterRefresh = { ...refresh, stage: '02' };
  const laterError = consoleError(laterRefresh);
  assert.deepEqual(
    unexpectedConsoleErrors([laterError], [...network, laterRefresh]),
    [laterError],
  );
  const sameStageRefresh = { ...refresh };
  const sameStageError = consoleError(sameStageRefresh);
  assert.deepEqual(
    unexpectedConsoleErrors(
      [consoleError(refresh), sameStageError],
      [refresh, login, sameStageRefresh],
    ),
    [sameStageError],
  );
  assert.deepEqual(unexpectedConsoleErrors([consoleError(refresh)], []), [
    consoleError(refresh),
  ]);
});

test('allows an expired admin refresh only when same-stage recovery immediately logs in', () => {
  const previousLogin = {
    stage: '01',
    actor: 'admin',
    method: 'POST',
    path: '/api/v1/auth/login',
    status: 200,
  };
  const expiredRefresh = {
    stage: 'M09',
    actor: 'admin',
    method: 'POST',
    path: '/api/v1/auth/refresh',
    status: 401,
  };
  const recoveryLogin = { ...previousLogin, stage: 'M09' };
  assert.deepEqual(
    unexpectedConsoleErrors(
      [consoleError(expiredRefresh)],
      [previousLogin, expiredRefresh, recoveryLogin],
    ),
    [],
  );
  const secondRefresh = { ...expiredRefresh, status: 403 };
  assert.deepEqual(
    unexpectedConsoleErrors(
      [consoleError(expiredRefresh), consoleError(secondRefresh)],
      [previousLogin, expiredRefresh, secondRefresh, recoveryLogin],
    ),
    [],
  );

  for (const suffix of [
    [],
    [
      {
        ...expiredRefresh,
        method: 'GET',
        path: '/api/v1/admin/meeting-records',
        status: 200,
      },
      recoveryLogin,
    ],
    [{ ...recoveryLogin, actor: 'leader' }],
    [{ ...recoveryLogin, stage: 'M12' }],
    [{ ...recoveryLogin, status: 401 }],
  ]) {
    const error = consoleError(expiredRefresh);
    assert.deepEqual(
      unexpectedConsoleErrors(
        [error],
        [previousLogin, expiredRefresh, ...suffix],
      ),
      [error],
    );
  }
});

test('allows only stage 18 admin missing-project reads proven by the peer list and another team project', () => {
  const peerList = {
    stage: '18',
    actor: 'admin',
    method: 'GET',
    path: '/api/v1/admin/sections/44/peer-evaluations',
    status: 200,
  };
  const missing = {
    stage: '18',
    actor: 'admin',
    method: 'GET',
    path: '/api/v1/teams/77/project',
    status: 404,
  };
  const existing = {
    ...missing,
    path: '/api/v1/teams/76/project',
    status: 200,
  };
  assert.deepEqual(
    unexpectedConsoleErrors(
      [consoleError(missing)],
      [peerList, missing, existing],
    ),
    [],
  );

  for (const network of [
    [missing, existing],
    [peerList, missing],
    [peerList, existing, missing],
    [peerList, missing, { ...existing, path: '/api/v1/teams/77/project' }],
    [{ ...peerList, status: 404 }, missing, existing],
    [{ ...peerList, stage: '17' }, missing, existing],
  ]) {
    const error = consoleError(missing);
    assert.deepEqual(unexpectedConsoleErrors([error], network), [error]);
  }
  for (const changed of [
    { stage: '17' },
    { actor: 'leader' },
    { method: 'POST' },
    { status: 403 },
    { path: '/api/v1/teams/077/project' },
    { path: '/api/v1/teams/77/project/extra' },
  ]) {
    const unexpected = { ...missing, ...changed };
    const error = consoleError(unexpected);
    assert.deepEqual(
      unexpectedConsoleErrors(
        [error],
        [peerList, unexpected, existing],
      ),
      [error],
    );
  }
});

test('allows only stage 06 student reads of the not-yet-created current mid-report', () => {
  const missing = {
    stage: '06',
    actor: 'leader',
    method: 'GET',
    path: '/api/v1/mid-reports/current',
    status: 404,
  };
  assert.deepEqual(
    unexpectedConsoleErrors([consoleError(missing)], [missing]),
    [],
  );
  for (const changed of [
    { stage: '09' },
    { actor: 'admin' },
    { method: 'POST' },
    { path: '/api/v1/mid-reports/1' },
    { status: 403 },
  ]) {
    const unexpected = { ...missing, ...changed };
    const error = consoleError(unexpected);
    assert.deepEqual(unexpectedConsoleErrors([error], [unexpected]), [error]);
  }
});

test('keeps uncorrelated resources, unexpected 403/404/500 and React/application errors as failures', () => {
  const network = [
    {
      ...response,
      stage: '07',
      path: '/api/v1/topic-candidates/1/votes',
      method: 'POST',
    },
    {
      ...response,
      stage: '10',
      actor: 'admin',
      path: '/api/v1/admin/oop/submissions/1/versions/9',
      status: 404,
    },
    { ...response, status: 500 },
    { ...response, stage: 'M04' },
  ];
  const errors = [
    ...network.map(consoleError),
    {
      ...consoleError(),
      message: 'In HTML, <form> cannot be a descendant of <form>.',
    },
    { ...consoleError(), message: 'Application error: 403 (Forbidden)' },
    { ...consoleError(), path: '/favicon.ico' },
  ];
  assert.deepEqual(unexpectedConsoleErrors(errors, network), errors);
  assert.deepEqual(unexpectedConsoleErrors([consoleError()], []), [
    consoleError(),
  ]);
});
