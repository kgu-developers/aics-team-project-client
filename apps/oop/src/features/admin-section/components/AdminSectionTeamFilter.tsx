import type { CurrentUser } from '@aics/core';
import { Selector, SelectorOption } from '@aics/design-system';
import type { ReactNode } from 'react';

import { useAdminSectionTeamsQuery } from '~/features/admin-student-team/queries';
import { useAuthStore } from '~/features/auth/authStore';

import * as styles from './AdminSectionTeamFilter.css';

export const ALL_SECTIONS = 'all';
export const ALL_TEAMS = '';

// A selector must return a stable reference; `?? []` per call would re-render forever.
const noSections: CurrentUser['sections'] = [];

type AdminSectionTeamFilterProps = {
  /** Offer an "전체 분반" option; otherwise the first section is expected to be selected. */
  allowAllSections?: boolean;
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
  allowAllSections = true,
  children,
  label = '분반 필터',
  onSectionChange,
  onTeamChange,
  sectionId,
  teamId,
}: AdminSectionTeamFilterProps) {
  const sections = useAuthStore(
    state => state.currentUser?.sections ?? noSections,
  );
  const hasTeamFilter = onTeamChange !== undefined;
  const isSectionSelected = sectionId !== ALL_SECTIONS;
  const teamsQuery = useAdminSectionTeamsQuery(
    hasTeamFilter && isSectionSelected ? sectionId : undefined,
  );

  return (
    <div aria-label={label} className={styles.root} role='group'>
      <Selector
        label='분반'
        onChange={onSectionChange}
        options={[
          ...(allowAllSections
            ? [{ label: '전체 분반', value: ALL_SECTIONS }]
            : []),
          ...sections.map(section => ({
            label: section.code,
            value: section.id,
          })),
        ]}
        renderOption={option => (
          <SelectorOption label={option.label ?? option.value} />
        )}
        value={sectionId}
        width={240}
      />
      {hasTeamFilter && isSectionSelected ? (
        <Selector
          isDisabled={teamsQuery.isPending}
          label='팀'
          onChange={onTeamChange}
          options={[
            { label: '전체 팀', value: ALL_TEAMS },
            ...(teamsQuery.data?.contents ?? []).map(team => ({
              label: team.name,
              value: String(team.id),
            })),
          ]}
          renderOption={option => (
            <SelectorOption label={option.label ?? option.value} />
          )}
          value={teamId ?? ALL_TEAMS}
          width={200}
        />
      ) : null}
      {children}
    </div>
  );
}
