export function createdMilestonePath(responseUrl: string, body: unknown) {
  const match = new URL(responseUrl).pathname.match(
    /^\/api\/v1\/admin\/sections\/(\d+)\/milestones$/,
  );
  if (!match)
    throw new Error(`Unexpected milestone creation URL: ${responseUrl}`);
  const id =
    body && typeof body === 'object' && 'id' in body
      ? (body as { id?: unknown }).id
      : undefined;
  if (typeof id !== 'number' || !Number.isInteger(id) || id <= 0)
    throw new Error('Milestone creation response is missing a positive id');
  return `/admin/milestones/${id}?sectionId=${match[1]}`;
}

export function milestoneTemplateOption(name: string) {
  return name === '발표' ? '발표 (자료 제출 + 평가)' : name;
}
