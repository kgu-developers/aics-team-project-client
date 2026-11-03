import { createFileRoute } from '@tanstack/react-router';

const messageFilters = ['ALL', 'GENERAL', 'PROPOSAL', 'MID_REPORT'] as const;
type MessageFilter = (typeof messageFilters)[number];

function positiveId(value: unknown) {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function nonNegativePage(value: unknown) {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : undefined;
}

function messageFilter(value: unknown): MessageFilter | undefined {
  return typeof value === 'string' && messageFilters.includes(value as never)
    ? (value as MessageFilter)
    : undefined;
}

function senderKeyword(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function sortDirection(value: unknown): 'ASC' | 'DESC' | undefined {
  return value === 'ASC' || value === 'DESC' ? value : undefined;
}

export const Route = createFileRoute('/admin/messages/teams/$teamId')({
  validateSearch: (
    search: Record<string, unknown>,
  ): {
    page?: number;
    sectionId?: number;
    senderKeyword?: string;
    sort?: 'ASC' | 'DESC';
    teamId?: number;
    type?: MessageFilter;
  } => ({
    page: nonNegativePage(search.page),
    sectionId: positiveId(search.sectionId),
    senderKeyword: senderKeyword(search.senderKeyword),
    sort: sortDirection(search.sort),
    teamId: positiveId(search.teamId),
    type: messageFilter(search.type),
  }),
});
