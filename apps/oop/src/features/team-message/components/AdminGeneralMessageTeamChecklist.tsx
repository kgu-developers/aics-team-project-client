import { MultiSelector, Text } from '@aics/design-system';
import { useEffect } from 'react';

import { useAdminSectionTeamsQuery } from '~/features/admin-student-team/queries';

type AdminGeneralMessageTeamChecklistProps = {
  canBroadcast: boolean;
  isDisabled?: boolean;
  onChange: (teamIds: string[]) => void;
  onInvalidTeamIds?: (teamIds: string[]) => void;
  sectionId: string;
  teamIds: string[];
};

/**
 * Keeps general-message recipients aligned with the API. Professors can choose
 * one, several, or every team in their section; other roles remain limited to
 * one team because only the section endpoint authorizes bulk delivery.
 */
export function AdminGeneralMessageTeamChecklist({
  canBroadcast,
  isDisabled = false,
  onChange,
  onInvalidTeamIds,
  sectionId,
  teamIds,
}: AdminGeneralMessageTeamChecklistProps) {
  const teamsQuery = useAdminSectionTeamsQuery(sectionId || undefined);
  const teams = teamsQuery.data?.contents ?? [];
  const availableTeamIds = teams.map(team => String(team.id));
  const selectedValues = [...new Set(teamIds)].filter(teamId =>
    availableTeamIds.includes(teamId),
  );
  const normalizedSelectedValues = canBroadcast
    ? selectedValues
    : selectedValues.slice(0, 1);

  const handleChange = (nextValues: string[]) => {
    const normalizedValues = [...new Set(nextValues)].filter(value =>
      availableTeamIds.includes(value),
    );
    if (canBroadcast) return onChange(normalizedValues);

    // Keep the existing per-team endpoint policy for assistants/admins.
    onChange(normalizedValues.slice(-1));
  };
  const isSelectorDisabled =
    isDisabled || teamsQuery.isPending || teamsQuery.isError;

  useEffect(() => {
    // A session draft can outlive a team deletion or a role/access change.
    // A non-professor draft may also predate the one-recipient policy.
    // Keep the first still-valid recipient in that case.
    if (
      teamsQuery.isSuccess &&
      (normalizedSelectedValues.length !== teamIds.length ||
        normalizedSelectedValues.some(
          (teamId, index) => teamId !== teamIds[index],
        ))
    ) {
      if (onInvalidTeamIds) {
        onInvalidTeamIds(normalizedSelectedValues);
        return;
      }
      onChange(normalizedSelectedValues);
    }
  }, [
    onChange,
    onInvalidTeamIds,
    normalizedSelectedValues,
    teamIds.length,
    teamsQuery.isSuccess,
  ]);

  return (
    <>
      <MultiSelector
        description={
          canBroadcast
            ? '한 팀 또는 여러 팀을 선택할 수 있습니다. 전체 선택은 분반의 모든 팀에 전송합니다.'
            : '현재 계정은 한 팀에만 보낼 수 있습니다.'
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
        selectAllLabel='전체 선택'
        triggerDisplay='labels'
        value={normalizedSelectedValues}
        width='100%'
      />
      {teamsQuery.isError ? (
        <Text role='alert'>팀 목록을 불러오지 못했습니다.</Text>
      ) : null}
    </>
  );
}
