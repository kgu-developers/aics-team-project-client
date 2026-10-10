import type { AdminOopSectionDto } from '@aics/api-client';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Heading,
  proportional,
  Selector,
  SelectorOption,
  Table,
  Text,
  useToast,
  type TableProps,
} from '@aics/design-system';
import { useNavigate } from '@tanstack/react-router';
import { useCallback, useMemo, useState } from 'react';

import { ROUTES } from '~/app/constants/routes';

import { cx } from '~/shared/lib/cx';

import {
  CourseDeleteDialog,
  CourseFormDialog,
  SectionCreateDialog,
} from '~/features/admin-course/components/AdminCourseDialogs';
import {
  contactVisibilityBadgeVariant,
  contactVisibilityStatus,
  semesterLabel,
  semesterOptions,
  statusBadgeVariant,
  statusLabel,
  statusOptions,
} from '~/features/admin-course/model/courseLabels';
import { useAdminOopCoursesQuery } from '~/features/admin-course/queries';
import { useAdminOopSectionsQuery } from '~/features/admin-section/queries';
import { useAuthStore } from '~/features/auth/authStore';
import { fetchSessionUser } from '~/features/auth/fetchSessionUser';

import * as styles from './AdminCoursesPage.css';

type SectionTablePlugin = NonNullable<
  TableProps<AdminOopSectionDto>['plugins']
>[string];

const SEMESTER_RECENCY = {
  SPRING: 1,
  SUMMER: 2,
  FALL: 3,
  WINTER: 4,
} as const;

export default function AdminCoursesPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const coursesQuery = useAdminOopCoursesQuery();
  const currentUser = useAuthStore(state => state.currentUser);
  const sessionRole = useAuthStore(state => state.sessionRole);
  const setCurrentUser = useAuthStore(state => state.setCurrentUser);
  const [yearFilter, setYearFilter] = useState('ALL');
  const [semesterFilter, setSemesterFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isCreateSectionOpen, setIsCreateSectionOpen] = useState(false);
  const courses = useMemo(
    () => coursesQuery.data?.contents ?? [],
    [coursesQuery.data],
  );
  const years = [...new Set(courses.map(course => course.year))].sort(
    (left, right) => right - left,
  );
  const filteredCourses = useMemo(
    () =>
      courses
        .filter(
          course =>
            (yearFilter === 'ALL' || String(course.year) === yearFilter) &&
            (semesterFilter === 'ALL' || course.semester === semesterFilter) &&
            (statusFilter === 'ALL' || course.status === statusFilter),
        )
        .sort(
          (left, right) =>
            right.year - left.year ||
            SEMESTER_RECENCY[right.semester] -
              SEMESTER_RECENCY[left.semester] ||
            right.id - left.id,
        ),
    [courses, semesterFilter, statusFilter, yearFilter],
  );
  const selectedCourse =
    filteredCourses.find(course => course.id === selectedCourseId) ??
    filteredCourses[0];
  const sectionsQuery = useAdminOopSectionsQuery(
    selectedCourse ? { courseId: selectedCourse.id } : undefined,
  );
  const sections = sectionsQuery.data?.contents ?? [];

  const openSection = useCallback(
    (section: AdminOopSectionDto) => {
      void navigate({
        params: { courseId: String(section.course.id) },
        search: { sectionId: Number(section.id) },
        to: ROUTES.ADMIN_COURSE_DETAIL,
      });
    },
    [navigate],
  );

  const sectionRowPlugin = useMemo<SectionTablePlugin>(
    () => ({
      transformBodyRow: (rowRenderProps, section) => {
        const onClick = rowRenderProps.htmlProps.onClick;
        const onKeyDown = rowRenderProps.htmlProps.onKeyDown;
        return {
          ...rowRenderProps,
          htmlProps: {
            ...rowRenderProps.htmlProps,
            'aria-label': `${section.code} 분반 운영 화면 열기`,
            className: cx(
              rowRenderProps.htmlProps.className,
              styles.clickableRow,
            ),
            onClick: event => {
              onClick?.(event);
              if (event.defaultPrevented) return;
              if (
                event.target instanceof Element &&
                event.target.closest('button, a')
              )
                return;
              openSection(section);
            },
            onKeyDown: event => {
              onKeyDown?.(event);
              if (
                event.defaultPrevented ||
                event.target !== event.currentTarget ||
                (event.key !== 'Enter' && event.key !== ' ')
              )
                return;
              event.preventDefault();
              openSection(section);
            },
            tabIndex: 0,
          },
        };
      },
    }),
    [openSection],
  );

  function applyFilter(setter: (value: string) => void) {
    return (value: string) => {
      setter(value);
      setSelectedCourseId(null);
    };
  }

  async function refreshSectionsAndSession() {
    const sectionResult = await sectionsQuery.refetch();
    if (!sessionRole) return !sectionResult.isError;

    try {
      setCurrentUser(await fetchSessionUser(sessionRole));
      return !sectionResult.isError;
    } catch {
      toast({ body: '분반 목록을 새로고침하지 못했습니다.' });
      return false;
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Heading level={1}>강좌·분반 관리</Heading>
      </header>

      <div aria-label='강좌 필터' className={styles.filters} role='group'>
        <Selector
          label='연도'
          onChange={applyFilter(setYearFilter)}
          options={[
            { label: '전체 연도', value: 'ALL' },
            ...years.map(year => ({ label: `${year}년`, value: String(year) })),
          ]}
          renderOption={option => (
            <SelectorOption label={option.label ?? option.value} />
          )}
          value={yearFilter}
          width={160}
        />
        <Selector
          label='학기'
          onChange={applyFilter(setSemesterFilter)}
          options={[{ label: '전체 학기', value: 'ALL' }, ...semesterOptions]}
          renderOption={option => (
            <SelectorOption label={option.label ?? option.value} />
          )}
          value={semesterFilter}
          width={160}
        />
        <Selector
          label='상태'
          onChange={applyFilter(setStatusFilter)}
          options={[{ label: '전체 상태', value: 'ALL' }, ...statusOptions]}
          renderOption={option => (
            <SelectorOption label={option.label ?? option.value} />
          )}
          value={statusFilter}
          width={160}
        />
        {filteredCourses.length > 0 ? (
          <div className={styles.courseSelector}>
            <Selector
              label='강좌'
              onChange={value => setSelectedCourseId(Number(value))}
              options={filteredCourses.map(course => ({
                label: `${course.name} (${course.year}년 ${semesterLabel(course.semester)})`,
                value: String(course.id),
              }))}
              renderOption={option => (
                <SelectorOption label={option.label ?? option.value} />
              )}
              value={String(selectedCourse?.id ?? '')}
              width='100%'
            />
          </div>
        ) : null}
      </div>

      {coursesQuery.isPending ? (
        <Text aria-live='polite' role='status'>
          강좌 목록을 불러오는 중입니다.
        </Text>
      ) : coursesQuery.isError ? (
        <EmptyState
          description='잠시 후 다시 시도해 주세요.'
          title='강좌 목록을 불러오지 못했습니다.'
        />
      ) : !selectedCourse ? (
        <EmptyState
          description='필터를 바꾸거나 새 강좌를 등록해 주세요.'
          title='표시할 강좌가 없습니다.'
        />
      ) : (
        <>
          <section className={styles.section}>
            <div className={styles.courseCardHeader}>
              <Heading level={2}>강좌 설정</Heading>
              <div
                aria-label='강좌 관리'
                className={styles.courseActions}
                role='group'
              >
                <Button
                  label='강좌 정보 수정'
                  onClick={() => setIsEditOpen(true)}
                  variant='secondary'
                />
                <Button
                  label='강좌 등록'
                  onClick={() => setIsCreateOpen(true)}
                />
                <Button
                  label='강좌 삭제'
                  onClick={() => setIsDeleteOpen(true)}
                  variant='ghost'
                />
              </div>
            </div>
            <Card className={styles.courseCard} padding={5}>
              <article
                aria-label={`${selectedCourse.name} 강좌 요약`}
                className={styles.courseSummary}
              >
                <div className={styles.courseIdentity}>
                  <div className={styles.courseTitleRow}>
                    <Heading level={3}>{selectedCourse.name}</Heading>
                    <Badge
                      label={statusLabel(selectedCourse.status)}
                      variant={statusBadgeVariant(selectedCourse.status)}
                    />
                  </div>
                </div>
                <dl className={styles.courseMetadata}>
                  <div className={styles.courseMetadataItem}>
                    <dt className={styles.courseMetadataLabel}>운영 학기</dt>
                    <dd className={styles.courseMetadataValue}>
                      {selectedCourse.year}년{' '}
                      {semesterLabel(selectedCourse.semester)}
                    </dd>
                  </div>
                  <div className={styles.courseMetadataItem}>
                    <dt className={styles.courseMetadataLabel}>등록 분반</dt>
                    <dd className={styles.courseMetadataValue}>
                      {sectionsQuery.isPending
                        ? '확인 중'
                        : sectionsQuery.isError
                          ? '확인 불가'
                          : `${sections.length}개`}
                    </dd>
                  </div>
                </dl>
              </article>
            </Card>
          </section>

          <section aria-labelledby='sections-title' className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <Heading id='sections-title' level={2}>
                  분반 선택
                </Heading>
              </div>
              <Button
                isDisabled={!currentUser?.studentNumber}
                label='분반 등록'
                onClick={() => setIsCreateSectionOpen(true)}
              />
            </div>

            {sectionsQuery.isPending ? (
              <Text aria-live='polite' role='status'>
                분반 목록을 불러오는 중입니다.
              </Text>
            ) : sectionsQuery.isError ? (
              <EmptyState
                description='잠시 후 다시 시도해 주세요.'
                title='분반 목록을 불러오지 못했습니다.'
              />
            ) : sections.length === 0 ? (
              <EmptyState
                description='분반을 등록하면 수강생과 팀을 관리할 수 있습니다.'
                title='등록된 분반이 없습니다.'
              />
            ) : (
              <Card padding={0}>
                <Table
                  aria-label={`${selectedCourse.name} 분반 목록`}
                  columns={[
                    {
                      align: 'start',
                      header: '분반 코드',
                      key: 'code',
                      width: proportional(1, { minWidth: 120 }),
                    },
                    {
                      align: 'start',
                      header: '수업 시간',
                      key: 'classTime',
                      width: proportional(1.4, { minWidth: 160 }),
                    },
                    {
                      align: 'start',
                      header: '온보딩 기간',
                      key: 'contactVisibleFrom',
                      renderCell: section => {
                        const visibility = contactVisibilityStatus(
                          section.contactVisibleFrom,
                          section.contactVisibleUntil,
                        );
                        return (
                          <Badge
                            label={visibility}
                            variant={contactVisibilityBadgeVariant(visibility)}
                          />
                        );
                      },
                      width: proportional(0.9, { minWidth: 120 }),
                    },
                    {
                      align: 'end',
                      header: '',
                      key: 'id',
                      renderCell: () => (
                        <span aria-hidden className={styles.rowChevron}>
                          ›
                        </span>
                      ),
                      width: proportional(0.2, { minWidth: 36 }),
                    },
                  ]}
                  data={sections}
                  dividers='rows'
                  hasHover
                  idKey='id'
                  plugins={{ rowInteraction: sectionRowPlugin }}
                  verticalAlign='middle'
                />
              </Card>
            )}
          </section>
        </>
      )}

      <CourseFormDialog
        courseId={null}
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => {
          setYearFilter('ALL');
          setSemesterFilter('ALL');
          setStatusFilter('ALL');
          setSelectedCourseId(null);
        }}
      />
      <CourseFormDialog
        courseId={selectedCourse?.id ?? null}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
      />
      <CourseDeleteDialog
        course={isDeleteOpen ? (selectedCourse ?? null) : null}
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onDeleted={() => setSelectedCourseId(null)}
      />
      {selectedCourse ? (
        <SectionCreateDialog
          course={selectedCourse}
          isOpen={isCreateSectionOpen}
          onClose={() => setIsCreateSectionOpen(false)}
          onCreated={refreshSectionsAndSession}
          professorId={currentUser?.studentNumber}
        />
      ) : null}
    </div>
  );
}
