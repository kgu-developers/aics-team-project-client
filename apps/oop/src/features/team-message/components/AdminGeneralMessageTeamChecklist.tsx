import { MultiSelector, Text } from '@aics/design-system';

import { useAdminSectionTeamsQuery } from '~/features/admin-student-team/queries';

export const ALL_TEAMS_RECIPIENT = '__all_teams__';

type AdminGeneralMessageTeamChecklistProps = {
  canBroadcast: boolean;
  isDisabled?: boolean;
  onChange: (teamId: string) => void;
  sectionId: string;
  teamId: string;
};

/**
 * Keeps the general-message recipient model aligned with the API: one team or
 * every team in a section. A whole-section selection renders every team as
 * checked, but does not allow an accidental partial bulk send.
 */
export function AdminGeneralMessageTeamChecklist({
  canBroadcast,
  isDisabled = false,
  onChange,
  sectionId,
  teamId,
}: AdminGeneralMessageTeamChecklistProps) {
  const teamsQuery = useAdminSectionTeamsQuery(sectionId || undefined);
  const teams = teamsQuery.data?.contents ?? [];
  const isAllTeamsSelected = canBroadcast && teamId === ALL_TEAMS_RECIPIENT;
  const selectedValues = isAllTeamsSelected
    ? teams.map(team => String(team.id))
    : teamId
      ? [teamId]
      : [];

  const handleChange = (nextValues: string[]) => {
    if (
      canBroadcast &&
      teams.length > 0 &&
      nextValues.length === teams.length
    ) {
      onChange(ALL_TEAMS_RECIPIENT);
      return;
    }

    if (isAllTeamsSelected) {
      // The API only accepts one team or the whole section. Clear the whole
      // section mode before a different individual team is chosen.
      onChange('');
      return;
    }

    // MultiSelector reports the complete collection. If the administrator
    // checks another team, choose that newly checked team instead of keeping
    // the prior one. The API still receives exactly one team recipient.
    onChange(
      nextValues.length > 1
        ? (nextValues.find(value => value !== teamId) ?? '')
        : (nextValues[0] ?? ''),
    );
  };
  const isSelectorDisabled =
    isDisabled || teamsQuery.isPending || teamsQuery.isError;

  return (
    <>
      <MultiSelector
        description={
          isAllTeamsSelected
            ? '현재는 전체 팀 또는 한 팀에만 보낼 수 있습니다. 전체 팀 선택을 해제한 뒤 한 팀을 선택해 주세요.'
            : '현재는 전체 팀 또는 한 팀에만 보낼 수 있습니다. 일부 팀 여러 개 선택 전송은 지원되지 않습니다.'
        }
        hasClear
        hasSelectAll={canBroadcast}
        isDisabled={isSelectorDisabled}
        label='팀'
        onChange={handleChange}
        options={teams.map(team => ({
          label: team.name,
          value: String(team.id),
        }))}
        placeholder='팀 선택'
        selectAllLabel='전체 팀'
        triggerDisplay='labels'
        value={selectedValues}
        width='100%'
      />
      {teamsQuery.isError ? (
        <Text role='alert'>팀 목록을 불러오지 못했습니다.</Text>
      ) : null}
    </>
  );
}
