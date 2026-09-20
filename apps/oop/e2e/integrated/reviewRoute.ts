export const presentationSettingsAccessibleName = '발표 순서·평가 항목 설정';

export function presentationEvaluationRowName(teamName: string) {
  return `${teamName} 발표 평가 보기`;
}

export function currentProposalDetailPath(url: string) {
  const parsed = new URL(url);
  if (!/^\/admin\/submissions\/[1-9]\d*$/.test(parsed.pathname))
    throw new Error(`Expected an admin proposal detail URL, received ${url}`);
  if (parsed.searchParams.get('milestoneId') !== 'proposal')
    throw new Error(`Expected a proposal detail URL, received ${url}`);

  return `${parsed.pathname}${parsed.search}`;
}
