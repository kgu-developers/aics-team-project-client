import { createFileRoute } from '@tanstack/react-router';

function sectionId(value: unknown) {
  const parsed = typeof value === 'number' ? value : Number(value);

  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
}

export const Route = createFileRoute('/admin/student-team')({
  validateSearch: (
    search: Record<string, unknown>,
  ): { sectionId?: number } => ({
    sectionId: sectionId(search.sectionId),
  }),
});
