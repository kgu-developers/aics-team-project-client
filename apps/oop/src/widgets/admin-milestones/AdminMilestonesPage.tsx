import type { AdminMilestoneType } from '@aics/api-client';
import {
  Button,
  Card,
  Divider,
  EmptyState,
  Heading,
  IconButton,
  Selector,
  SelectorOption,
  Tab,
  TabList,
  Text,
} from '@aics/design-system';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { Pencil } from 'lucide-react';
import { type KeyboardEvent, useState } from 'react';

import { ROUTES } from '~/app/constants/routes';

import { formatAdminSectionLabel } from '~/shared/lib/formatAdminSectionLabel';
import { paginate } from '~/shared/lib/pagination';
import ListPagination from '~/shared/ui/ListPagination/ListPagination';

import { useActiveAdminSections } from '~/features/admin-course/queries';
import {
  formatAdminMilestoneDate,
  getAdminMilestoneStatusLabel,
} from '~/features/admin-milestone-review/model';
import {
  useAdminAccessibleSectionMilestonesQuery,
  useUpdateAdminSectionMilestoneStatusMutation,
} from '~/features/admin-milestone-review/queries';
import AdminSectionTeamFilter from '~/features/admin-section/components/AdminSectionTeamFilter';

import * as styles from './AdminMilestonesPage.css';

const allSectionsValue = 'all';
const allMilestoneTypesValue = 'all';
const milestonePageSize = 8;

const filterableMilestoneTypes = [
  'PROPOSAL',
  'MID_REPORT',
  'PRESENTATION',
  'FINAL_REPORT',
  'PEER_EVALUATION',
] as const satisfies readonly AdminMilestoneType[];

const milestoneTypeTabs = [
  { label: '전체', value: allMilestoneTypesValue },
  { label: '제안서', value: 'PROPOSAL' },
  { label: '중간 보고서', value: 'MID_REPORT' },
  { label: '발표', value: 'PRESENTATION' },
  { label: '최종 보고서', value: 'FINAL_REPORT' },
  { label: '상호 평가', value: 'PEER_EVALUATION' },
] as const satisfies readonly {
  label: string;
  value: AdminMilestoneType | typeof allMilestoneTypesValue;
}[];

type StatusUpdateError = {
  key: string;
  message: string;
};

function isFilterableMilestoneType(
  value: string | undefined,
): value is (typeof filterableMilestoneTypes)[number] {
  return (
    value !== undefined && filterableMilestoneTypes.some(type => type === value)
  );
}

/**
 * Clicks that start inside a control must not open the row. The design-system
 * Selector renders its option list as a sibling `popover` of the combobox
 * trigger, so listbox/option targets are matched explicitly as well.
 */
const rowInteractiveSelector = [
  'a',
  'button',
  'input',
  'select',
  'textarea',
  '[role="combobox"]',
  '[role="listbox"]',
  '[role="option"]',
  '[popover]',
].join(', ');

function isRowInteractiveTarget(target: EventTarget | null) {
  return (
    target instanceof Element && target.closest(rowInteractiveSelector) !== null
  );
}

function handleRowNavigation(
  event: KeyboardEvent<HTMLTableRowElement>,
  open: () => void,
) {
  if (
    isRowInteractiveTarget(event.target) ||
    (event.key !== 'Enter' && event.key !== ' ')
  )
    return;
  event.preventDefault();
  open();
}

export default function AdminMilestonesPage() {
  const navigate = useNavigate();
  const rawSearch = useSearch({ from: '/admin/milestones/' }) as {
    milestoneType?: string;
    sectionId?: string | number;
  };
  // Hand-typed URLs arrive as numbers; router links serialize strings.
  const search = {
    milestoneType: isFilterableMilestoneType(rawSearch.milestoneType)
      ? rawSearch.milestoneType
      : undefined,
    sectionId:
      rawSearch.sectionId === undefined
        ? undefined
        : String(rawSearch.sectionId),
  };
  const activeSectionsQuery = useActiveAdminSections();
  const accessibleSections = activeSectionsQuery.data;
  const accessibleSectionIds = accessibleSections.map(section => section.id);
  const selectedSectionId =
    search.sectionId && accessibleSectionIds.includes(search.sectionId)
      ? search.sectionId
      : allSectionsValue;
  const displayedSections = accessibleSections.filter(
    section =>
      selectedSectionId === allSectionsValue ||
      section.id === selectedSectionId,
  );
  const milestoneQueries = useAdminAccessibleSectionMilestonesQuery(
    displayedSections.map(section => section.id),
  );
  const updateStatusMutation = useUpdateAdminSectionMilestoneStatusMutation();
  const [statusUpdateError, setStatusUpdateError] =
    useState<StatusUpdateError>();
  const selectedMilestoneType = search.milestoneType ?? allMilestoneTypesValue;
  const isLoading = milestoneQueries.some(query => query.isPending);
  const hasSuccessfulQuery = milestoneQueries.some(query => query.isSuccess);
  const failedSectionLabels = displayedSections.flatMap((section, index) =>
    milestoneQueries[index]?.isError ? [section.code] : [],
  );
  const allMilestones = displayedSections.flatMap((section, index) => {
    return (milestoneQueries[index]?.data?.content ?? []).map(milestone => ({
      ...milestone,
      sectionKey: section.id,
      sectionLabel: formatAdminSectionLabel(section),
    }));
  });
  const [page, setPage] = useState(0);
  const filteredMilestones = allMilestones.filter(
    milestone =>
      selectedMilestoneType === allMilestoneTypesValue ||
      milestone.type === selectedMilestoneType,
  );
  const paged = paginate(filteredMilestones, page, milestonePageSize);
  const milestones = paged.items;

  function selectSection(sectionId: string) {
    setPage(0);
    void navigate({
      search: {
        ...(sectionId === allSectionsValue ? {} : { sectionId }),
        ...(selectedMilestoneType === allMilestoneTypesValue
          ? {}
          : { milestoneType: selectedMilestoneType }),
      },
      to: ROUTES.ADMIN_MILESTONES,
    });
  }

  function updateStatus(
    milestone: (typeof milestones)[number],
    nextStatus: 'DRAFT' | 'PUBLISHED',
  ) {
    const key = `${milestone.sectionKey}-${milestone.id}`;
    setStatusUpdateError(undefined);
    updateStatusMutation.mutate(
      {
        milestoneId: String(milestone.id),
        sectionId: milestone.sectionKey,
        status: nextStatus,
      },
      {
        onError: error => {
          setStatusUpdateError({
            key,
            message:
              error instanceof Error
                ? error.message
                : '공개 상태를 변경하지 못했습니다. 다시 시도해 주세요.',
          });
        },
      },
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.titleRow}>
        <Heading level={1}>마일스톤 관리</Heading>
        <Link className={styles.backLink} to={ROUTES.ADMIN}>
          ← 홈으로
        </Link>
      </div>

      <div className={styles.filterRow}>
        <AdminSectionTeamFilter
          onSectionChange={selectSection}
          sectionId={selectedSectionId}
        />
        <Button
          label='마일스톤 추가'
          onClick={() => navigate({ to: ROUTES.ADMIN_MILESTONE_NEW })}
          variant='primary'
        />
      </div>
      <Divider className={styles.filterDivider} />

      <TabList
        aria-label='마일스톤 단계 필터'
        onChange={value => {
          setPage(0);
          void navigate({
            search: {
              ...(selectedSectionId === allSectionsValue
                ? {}
                : { sectionId: selectedSectionId }),
              ...(value === allMilestoneTypesValue
                ? {}
                : { milestoneType: value }),
            },
            to: ROUTES.ADMIN_MILESTONES,
          });
        }}
        value={selectedMilestoneType}
      >
        {milestoneTypeTabs.map(tab => (
          <Tab key={tab.value} label={tab.label} value={tab.value} />
        ))}
      </TabList>

      {activeSectionsQuery.isPending ? (
        <Text aria-live='polite' role='status'>
          운영 중인 분반을 불러오는 중입니다.
        </Text>
      ) : activeSectionsQuery.isError ? (
        <EmptyState
          description='잠시 후 다시 시도해 주세요.'
          title='운영 중인 분반을 불러오지 못했습니다.'
        />
      ) : accessibleSectionIds.length === 0 ? (
        <EmptyState
          description='운영 중인 담당 분반이 없어 마일스톤을 조회할 수 없습니다.'
          title='표시할 마일스톤이 없습니다.'
        />
      ) : isLoading && !hasSuccessfulQuery ? (
        <Text aria-live='polite' role='status'>
          마일스톤을 불러오는 중입니다.
        </Text>
      ) : !hasSuccessfulQuery && failedSectionLabels.length > 0 ? (
        <EmptyState
          description='잠시 후 다시 시도해 주세요.'
          title='마일스톤을 불러오지 못했습니다.'
        />
      ) : (
        <>
          {failedSectionLabels.length > 0 ? (
            <Text aria-live='polite' role='status' type='supporting'>
              {failedSectionLabels.join(', ')} 분반의 마일스톤을 불러오지
              못했습니다.
            </Text>
          ) : null}
          {milestones.length === 0 ? (
            <EmptyState
              description='마일스톤 추가 버튼으로 새 일정을 설정할 수 있습니다.'
              title='등록된 마일스톤이 없습니다.'
            />
          ) : (
            <Card className={styles.tableCard}>
              <table className={styles.table}>
                <colgroup>
                  <col className={styles.sectionColumn} />
                  <col />
                  <col className={styles.dueAtColumn} />
                  <col className={styles.actionColumn} />
                  <col className={styles.statusColumn} />
                </colgroup>
                <thead>
                  <tr>
                    <th>적용 분반</th>
                    <th>제목</th>
                    <th>마감일</th>
                    <th scope='col'>관리</th>
                    <th>공개 상태</th>
                  </tr>
                </thead>
                <tbody>
                  {milestones.map(milestone => {
                    const openMilestone = () =>
                      void navigate({
                        params: { milestoneId: String(milestone.id) },
                        search: {
                          sectionId: milestone.sectionKey,
                          ...(selectedMilestoneType === allMilestoneTypesValue
                            ? {}
                            : { milestoneType: selectedMilestoneType }),
                        },
                        to: ROUTES.ADMIN_MILESTONE_DETAIL,
                      });
                    const editMilestone = () =>
                      void navigate({
                        search: {
                          milestoneId: String(milestone.id),
                          sectionId: milestone.sectionKey,
                          ...(selectedMilestoneType === allMilestoneTypesValue
                            ? {}
                            : { milestoneType: selectedMilestoneType }),
                        },
                        to: ROUTES.ADMIN_MILESTONE_NEW,
                      });

                    return (
                      <tr
                        aria-label={`${milestone.title} 마일스톤 보기`}
                        className={styles.clickableRow}
                        key={`${milestone.sectionId}-${milestone.id}-${milestone.sectionLabel}`}
                        onClick={event => {
                          if (!isRowInteractiveTarget(event.target)) {
                            openMilestone();
                          }
                        }}
                        onKeyDown={event =>
                          handleRowNavigation(event, openMilestone)
                        }
                        tabIndex={0}
                      >
                        <td
                          className={styles.sectionLabel}
                          title={milestone.sectionLabel}
                        >
                          {milestone.sectionLabel}
                        </td>
                        <td className={styles.milestoneTitle}>
                          {milestone.title}
                        </td>
                        <td>
                          {formatAdminMilestoneDate(milestone.schedule.dueAt)}
                        </td>
                        <td>
                          <IconButton
                            icon={<Pencil aria-hidden='true' size={16} />}
                            label={`${milestone.title} 수정`}
                            onClick={event => {
                              event.stopPropagation();
                              editMilestone();
                            }}
                            variant='secondary'
                          />
                        </td>
                        <td>
                          {milestone.status === 'CLOSED' ? (
                            <Text>
                              {getAdminMilestoneStatusLabel(milestone.status)}
                            </Text>
                          ) : (
                            <div
                              onClick={event => event.stopPropagation()}
                              onKeyDown={event => event.stopPropagation()}
                            >
                              <Selector
                                aria-label={`${milestone.sectionLabel} ${milestone.title} 공개 상태`}
                                isDisabled={
                                  updateStatusMutation.isPending &&
                                  updateStatusMutation.variables?.sectionId ===
                                    milestone.sectionKey &&
                                  updateStatusMutation.variables
                                    ?.milestoneId === String(milestone.id)
                                }
                                isLabelHidden
                                label='공개 상태'
                                onChange={nextStatus =>
                                  updateStatus(
                                    milestone,
                                    nextStatus as 'DRAFT' | 'PUBLISHED',
                                  )
                                }
                                options={[
                                  { label: '미공개', value: 'DRAFT' },
                                  { label: '공개', value: 'PUBLISHED' },
                                ]}
                                renderOption={option => (
                                  <SelectorOption
                                    label={option.label ?? option.value}
                                  />
                                )}
                                value={milestone.status}
                                width={120}
                              />
                            </div>
                          )}
                          {statusUpdateError?.key ===
                          `${milestone.sectionKey}-${milestone.id}` ? (
                            <Text role='alert' type='supporting'>
                              {statusUpdateError.message}
                            </Text>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          )}
          <ListPagination
            label='마일스톤 페이지 이동'
            onPageChange={setPage}
            page={paged.page}
            pageCount={paged.pageCount}
          />
        </>
      )}
    </div>
  );
}
