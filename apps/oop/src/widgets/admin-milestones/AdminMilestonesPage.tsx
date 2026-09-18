import {
  Button,
  Card,
  EmptyState,
  Heading,
  Selector,
  SelectorOption,
  Text,
} from '@aics/design-system';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { type KeyboardEvent, useState } from 'react';

import { ROUTES } from '~/app/constants/routes';

import {
  formatAdminMilestoneDate,
  getAdminMilestoneStatusLabel,
} from '~/features/admin-milestone-review/model';
import {
  useAdminAccessibleSectionMilestonesQuery,
  useUpdateAdminSectionMilestoneStatusMutation,
} from '~/features/admin-milestone-review/queries';
import { useAuthStore } from '~/features/auth/authStore';

import * as styles from './AdminMilestonesPage.css';

const allSectionsValue = 'all';

type StatusUpdateError = {
  key: string;
  message: string;
};

function isRowInteractiveTarget(target: EventTarget | null) {
  return (
    target instanceof Element &&
    target.closest('a, button, input, select, textarea, [role="combobox"]') !==
      null
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
  const currentUser = useAuthStore(state => state.currentUser);
  const navigate = useNavigate();
  const search = useSearch({ from: '/admin/milestones/' }) as {
    sectionId?: string;
  };
  const accessibleSections = currentUser?.sections ?? [];
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
  const isLoading = milestoneQueries.some(query => query.isPending);
  const hasSuccessfulQuery = milestoneQueries.some(query => query.isSuccess);
  const failedSectionLabels = displayedSections.flatMap((section, index) =>
    milestoneQueries[index]?.isError ? [section.code] : [],
  );
  const milestones = displayedSections.flatMap((section, index) => {
    return (milestoneQueries[index]?.data?.content ?? []).map(milestone => ({
      ...milestone,
      sectionKey: section.id,
      sectionLabel: section.code,
    }));
  });

  function selectSection(sectionId: string) {
    void navigate({
      search: sectionId === allSectionsValue ? {} : { sectionId },
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
      <Text className={styles.description} type='supporting'>
        담당 분반의 마일스톤 공개 일정과 제출 마감 일시를 확인하고 설정합니다.
      </Text>

      <div className={styles.filterRow}>
        <div className={styles.filters} role='group' aria-label='분반 필터'>
          {[
            { label: '전체', value: allSectionsValue },
            ...accessibleSections.map(section => ({
              label: section.code,
              value: section.id,
            })),
          ].map(section => (
            <button
              aria-pressed={selectedSectionId === section.value}
              className={
                selectedSectionId === section.value
                  ? styles.filterActive
                  : styles.filter
              }
              key={section.value}
              onClick={() => selectSection(section.value)}
              type='button'
            >
              {section.label}
            </button>
          ))}
        </div>
        <Button
          label='마일스톤 추가'
          onClick={() => navigate({ to: ROUTES.ADMIN_MILESTONE_NEW })}
          variant='primary'
        />
      </div>

      {accessibleSectionIds.length === 0 ? (
        <EmptyState
          description='담당 분반이 없어 마일스톤을 조회할 수 없습니다.'
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
                  <col className={styles.statusColumn} />
                </colgroup>
                <thead>
                  <tr>
                    <th>적용 분반</th>
                    <th>제목</th>
                    <th>마감일</th>
                    <th>공개 상태</th>
                  </tr>
                </thead>
                <tbody>
                  {milestones.map(milestone => {
                    const openMilestone = () =>
                      void navigate({
                        params: { milestoneId: String(milestone.id) },
                        search: { sectionId: milestone.sectionKey },
                        to: ROUTES.ADMIN_MILESTONE_DETAIL,
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
                        <td>{milestone.sectionLabel}</td>
                        <td className={styles.milestoneTitle}>
                          {milestone.title}
                        </td>
                        <td>
                          {formatAdminMilestoneDate(milestone.schedule.dueAt)}
                        </td>
                        <td>
                          {milestone.status === 'CLOSED' ? (
                            <Text>
                              {getAdminMilestoneStatusLabel(milestone.status)}
                            </Text>
                          ) : (
                            <Selector
                              aria-label={`${milestone.sectionLabel} ${milestone.title} 공개 상태`}
                              isDisabled={
                                updateStatusMutation.isPending &&
                                updateStatusMutation.variables?.sectionId ===
                                  milestone.sectionKey &&
                                updateStatusMutation.variables?.milestoneId ===
                                  String(milestone.id)
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
        </>
      )}
    </div>
  );
}
