import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import type { FetchMySectionsFilter, MySectionsResponse } from '@aics/core';
import { sectionSemesters, sectionStatuses } from '@aics/core';
import { http, HttpResponse } from 'msw';

import {
  getMockAuthenticatedAccount,
  mockCsrfResponseHeaders,
} from '../authSession';
import { getMockMySections } from '../data/sections';

function readFilter(
  url: URL,
): { ok: true; value: FetchMySectionsFilter } | { ok: false } {
  const status = url.searchParams.get('status') ?? undefined;
  const yearInput = url.searchParams.get('year') ?? undefined;
  const semester = url.searchParams.get('semester') ?? undefined;

  if (
    (status && !sectionStatuses.includes(status as never)) ||
    (semester && !sectionSemesters.includes(semester as never)) ||
    (yearInput && !/^-?\d+$/.test(yearInput))
  ) {
    return { ok: false };
  }

  return {
    ok: true,
    value: {
      status: status as FetchMySectionsFilter['status'],
      year: yearInput ? Number(yearInput) : undefined,
      semester: semester as FetchMySectionsFilter['semester'],
    },
  };
}

export const sectionHandlers = [
  http.get(`${API_BASE_URL}${ENDPOINTS.SECTION.MY_SECTIONS}`, ({ request }) => {
    const account = getMockAuthenticatedAccount(request);
    if (!account) return new HttpResponse(null, { status: 401 });

    const filter = readFilter(new URL(request.url));
    if (!filter.ok) {
      return HttpResponse.json({ code: 'INVALID_INPUT' }, { status: 400 });
    }

    const contents = getMockMySections(
      account.credentials.studentNumber,
      filter.value,
    );

    return HttpResponse.json<MySectionsResponse>(
      { contents },
      { headers: mockCsrfResponseHeaders() },
    );
  }),
];
