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

export const Route = createFileRoute('/admin/messages/teams/$teamId')({
  validateSearch: (
    search: Record<string, unknown>,
  ): {
    page?: number;
    sectionId?: number;
    teamId?: number;
    type?: MessageFilter;
  } => ({
    page: nonNegativePage(search.page),
    sectionId: positiveId(search.sectionId),
    teamId: positiveId(search.teamId),
    type: messageFilter(search.type),
  }),
});
