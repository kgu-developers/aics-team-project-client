import type { AdminOopCourseDto } from '@aics/api-client';
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
  type TableProps,
} from '@aics/design-system';
import { useNavigate } from '@tanstack/react-router';
import { useMemo, useState } from 'react';

import { ROUTES } from '~/app/constants/routes';

import { cx } from '~/shared/lib/cx';
import { paginate } from '~/shared/lib/pagination';
import ListPagination from '~/shared/ui/ListPagination/ListPagination';

import { CourseFormDialog } from '~/features/admin-course/components/AdminCourseDialogs';
import {
  semesterLabel,
  semesterOptions,
  statusBadgeVariant,
  statusLabel,
  statusOptions,
} from '~/features/admin-course/model/courseLabels';
import { useAdminOopCoursesQuery } from '~/features/admin-course/queries';

import * as styles from './AdminCoursesPage.css';

type CourseTablePlugin = NonNullable<
  TableProps<AdminOopCourseDto>['plugins']
>[string];

const SEMESTER_RECENCY = {
  SPRING: 1,
  SUMMER: 2,
  FALL: 3,
  WINTER: 4,
} as const;

/**
 * 강좌 목록. Each row opens the course detail where sections and roster
 * uploads for that course live; creation stays here.
 */
export default function AdminCoursesPage() {
  const navigate = useNavigate();
  const coursesQuery = useAdminOopCoursesQuery();
  const [yearFilter, setYearFilter] = useState('ALL');
  const [semesterFilter, setSemesterFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [page, setPage] = useState(0);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
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
  const paged = paginate(filteredCourses, page);

  function openCourse(course: AdminOopCourseDto) {
    void navigate({
      params: { courseId: String(course.id) },
      to: ROUTES.ADMIN_COURSE_DETAIL,
    });
  }

  const rowPlugin = useMemo<CourseTablePlugin>(
    () => ({
      transformBodyRow: (rowRenderProps, course) => {
        const onClick = rowRenderProps.htmlProps.onClick;
        const onKeyDown = rowRenderProps.htmlProps.onKeyDown;
        return {
          ...rowRenderProps,
          htmlProps: {
            ...rowRenderProps.htmlProps,
            'aria-label': `${course.name} 강좌 상세 보기`,
            className: cx(
              rowRenderProps.htmlProps.className,
              styles.clickableRow,
            ),
            onClick: event => {
              onClick?.(event);
              if (!event.defaultPrevented) openCourse(course);
            },
            onKeyDown: event => {
              onKeyDown?.(event);
              if (
                event.defaultPrevented ||
                (event.key !== 'Enter' && event.key !== ' ')
              )
                return;
              event.preventDefault();
              openCourse(course);
            },
            tabIndex: 0,
          },
        };
      },
    }),
    // navigate is referentially stable in TanStack Router.
    [],
  );

  function applyFilter(setter: (value: string) => void) {
    return (value: string) => {
      setter(value);
      setPage(0);
    };
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <Heading level={1}>강좌·분반 관리</Heading>
          <Text color='secondary'>
            강좌를 선택하면 분반과 명단 업로드를 한 화면에서 관리할 수 있습니다.
          </Text>
        </div>
        <Button label='강좌 등록' onClick={() => setIsCreateOpen(true)} />
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
      ) : filteredCourses.length === 0 ? (
        <EmptyState
          description='필터를 바꾸거나 새 강좌를 등록해 주세요.'
          title='표시할 강좌가 없습니다.'
        />
      ) : (
        <>
          <Card padding={0}>
            <Table
              columns={[
                {
                  align: 'start',
                  header: '강좌명',
                  key: 'name',
                  width: proportional(2, { minWidth: 200 }),
                },
                {
                  align: 'start',
                  header: '연도',
                  key: 'year',
                  width: proportional(0.6, { minWidth: 80 }),
                },
                {
                  align: 'start',
                  header: '학기',
                  key: 'semester',
                  renderCell: course => semesterLabel(course.semester),
                  width: proportional(0.8, { minWidth: 96 }),
                },
                {
                  align: 'start',
                  header: '상태',
                  key: 'status',
                  renderCell: course => (
                    <Badge
                      label={statusLabel(course.status)}
                      variant={statusBadgeVariant(course.status)}
                    />
                  ),
                  width: proportional(0.8, { minWidth: 100 }),
                },
              ]}
              data={paged.items}
              dividers='rows'
              hasHover
              idKey='id'
              plugins={{ rowInteraction: rowPlugin }}
              verticalAlign='middle'
            />
          </Card>
          <ListPagination
            label='강좌 페이지 이동'
            onPageChange={setPage}
            page={paged.page}
            pageCount={paged.pageCount}
          />
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
          setPage(0);
        }}
      />
    </div>
  );
}
