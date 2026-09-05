import type { FetchMySectionsFilter } from '@aics/core';

export const sectionKeys = {
  all: ['sections'] as const,
  mySections: (filter: FetchMySectionsFilter = {}) =>
    [
      ...sectionKeys.all,
      'mine',
      filter.status ?? null,
      filter.year ?? null,
      filter.semester ?? null,
    ] as const,
};
