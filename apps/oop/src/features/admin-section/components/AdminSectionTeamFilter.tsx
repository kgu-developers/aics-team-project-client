import { Selector, SelectorOption, Tab, TabList } from '@aics/design-system';
import type { ReactNode } from 'react';

import { formatAdminSectionLabel } from '~/shared/lib/formatAdminSectionLabel';

import { useActiveAdminSections } from '~/features/admin-course/queries';
import { useAdminSectionTeamsQuery } from '~/features/admin-student-team/queries';

import { ADMIN_TEAM_FILTER_WIDTH } from '../filterLayout';
import * as styles from './AdminSectionTeamFilter.css';

export const ALL_SECTIONS = 'all';
export const ALL_TEAMS = '';

type AdminSectionTeamFilterProps = {
  /** Override the filter sentinel when an action must distinguish "전체 팀" from no selection. */
  allTeamValue?: string;
  /** Offer an "전체 분반" option; otherwise the first section is expected to be selected. */
  allowAllSections?: boolean;
  /** Offer an "전체 팀" option when the team selector is rendered. */
  allowAllTeams?: boolean;
  /** Extra filters rendered after the section/team selectors (e.g. milestone). */
  children?: ReactNode;
  /** Selected section id, or `ALL_SECTIONS`. */
  sectionId: string;
  onSectionChange: (sectionId: string) => void;
  /** Provide both to render the dependent team selector. */
  teamId?: string;
  onTeamChange?: (teamId: string) => void;
  label?: string;
};

/**
 * The one way admin screens pick a section (and optionally a team within
 * it). Sections come from the signed-in user's assignments; teams are
 * loaded for the selected section only, so the team selector is hidden
 * while "전체 분반" is active.
 */
export default function AdminSectionTeamFilter({
  allTeamValue = ALL_TEAMS,
  allowAllSections = true,
  allowAllTeams = true,
  children,
  label = '분반 필터',
  onSectionChange,
  onTeamChange,
  sectionId,
  teamId,
}: AdminSectionTeamFilterProps) {
  const sectionsQuery = useActiveAdminSections();
  const sections = sectionsQuery.data;
  const hasTeamFilter = onTeamChange !== undefined;
  const isSectionSelected = sectionId !== ALL_SECTIONS;
  const teamsQuery = useAdminSectionTeamsQuery(
    hasTeamFilter && isSectionSelected ? sectionId : undefined,
  );

  return (
    <div aria-label={label} className={styles.root} role='group'>
      <TabList
        aria-label='분반'
        className={styles.sectionTabs}
        onChange={onSectionChange}
        overflow='scroll'
        value={sectionId}
      >
        {allowAllSections ? (
          <Tab label='전체 분반' value={ALL_SECTIONS} />
        ) : null}
        {sections.map(section => (
          <Tab
            aria-disabled={sectionsQuery.isPending || sectionsQuery.isError}
            key={section.id}
            label={formatAdminSectionLabel(section)}
            value={String(section.id)}
          />
        ))}
      </TabList>
      {hasTeamFilter && isSectionSelected ? (
        <Selector
          isDisabled={teamsQuery.isPending}
          label='팀'
          onChange={onTeamChange}
          options={[
            ...(allowAllTeams
              ? [{ label: '전체 팀', value: allTeamValue }]
              : []),
            ...(teamsQuery.data?.contents ?? []).map(team => ({
              label: team.name,
              value: String(team.id),
            })),
          ]}
          renderOption={option => (
            <SelectorOption label={option.label ?? option.value} />
          )}
          value={teamId ?? allTeamValue}
          width={ADMIN_TEAM_FILTER_WIDTH}
        />
      ) : null}
      {children}
    </div>
  );
}
