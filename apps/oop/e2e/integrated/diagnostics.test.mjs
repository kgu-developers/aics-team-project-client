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
    { ...response, method: 'POST', path: '/api/v1/oop/auth/refresh' },
    {
      ...response,
      stage: '03',
      actor: 'survey',
      path: '/api/v1/oop/users/me/pre-survey-response',
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
      path: '/api/v1/admin/oop/meeting-records/12',
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
