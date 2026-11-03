import type { AdminOopCourseDto, AdminOopSectionDto } from '@aics/api-client';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Heading,
  IconButton,
  proportional,
  Table,
  Text,
  useToast,
  type TableProps,
} from '@aics/design-system';
import { useNavigate } from '@tanstack/react-router';
import { Pencil, Trash2 } from 'lucide-react';
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
  statusBadgeVariant,
  statusLabel,
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
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isCreateSectionOpen, setIsCreateSectionOpen] = useState(false);
  const courses = useMemo(
    () => coursesQuery.data?.contents ?? [],
    [coursesQuery.data],
  );
  const orderedCourses = useMemo(
    () =>
      [...courses].sort(
        (left, right) =>
          right.year - left.year ||
          SEMESTER_RECENCY[right.semester] - SEMESTER_RECENCY[left.semester] ||
          right.id - left.id,
      ),
    [courses],
  );
  const selectedCourse = orderedCourses.find(
    course => course.id === selectedCourseId,
  );

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

  async function refreshSession() {
    if (!sessionRole) return true;

    try {
      setCurrentUser(await fetchSessionUser(sessionRole));
      return true;
    } catch {
      toast({ body: '분반 목록을 새로고침하지 못했습니다.' });
      return false;
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Heading level={1}>강좌·분반 관리</Heading>
        <Button label='강좌 등록' onClick={() => setIsCreateOpen(true)} />
      </header>

      {coursesQuery.isPending ? (
        <Text aria-live='polite' role='status'>
          강좌 목록을 불러오는 중입니다.
        </Text>
      ) : coursesQuery.isError ? (
        <EmptyState
          description='잠시 후 다시 시도해 주세요.'
          title='강좌 목록을 불러오지 못했습니다.'
        />
      ) : orderedCourses.length === 0 ? (
        <EmptyState
          description='새 강좌를 등록해 주세요.'
          title='표시할 강좌가 없습니다.'
        />
      ) : (
        <>
          <div className={styles.courseList}>
            {orderedCourses.map(course => (
              <AdminCourseOverview
                course={course}
                isSectionCreationDisabled={!currentUser?.studentNumber}
                key={course.id}
                onCreateSection={() => {
                  setSelectedCourseId(course.id);
                  setIsCreateSectionOpen(true);
                }}
                onDelete={() => {
                  setSelectedCourseId(course.id);
                  setIsDeleteOpen(true);
                }}
                onEdit={() => {
                  setSelectedCourseId(course.id);
                  setIsEditOpen(true);
                }}
                onOpenSection={openSection}
                professorName={currentUser?.name}
              />
            ))}
          </div>
        </>
      )}

      <CourseFormDialog
        courseId={null}
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        professorName={currentUser?.name}
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
          onCreated={refreshSession}
          professorId={currentUser?.studentNumber}
        />
      ) : null}
    </div>
  );
}

function AdminCourseOverview({
  course,
  isSectionCreationDisabled,
  onCreateSection,
  onDelete,
  onEdit,
  onOpenSection,
  professorName,
}: {
  course: AdminOopCourseDto;
  isSectionCreationDisabled: boolean;
  onCreateSection: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onOpenSection: (section: AdminOopSectionDto) => void;
  professorName?: string;
}) {
  const sectionsQuery = useAdminOopSectionsQuery({ courseId: course.id });
  const sections = sectionsQuery.data?.contents ?? [];
  const courseLabel = `${course.name} · ${course.year}년 ${semesterLabel(
    course.semester,
  )}`;
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
              if (
                event.defaultPrevented ||
                (event.target instanceof Element &&
                  event.target.closest('button, a'))
              )
                return;
              onOpenSection(section);
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
              onOpenSection(section);
            },
            tabIndex: 0,
          },
        };
      },
    }),
    [onOpenSection],
  );

  return (
    <section aria-label={courseLabel} className={styles.section}>
      <div className={styles.courseCardHeader}>
        <Heading level={2}>{course.name}</Heading>
      </div>
      <Card className={styles.courseCard} padding={5}>
        <article
          aria-label={`${courseLabel} 강좌 요약`}
          className={styles.courseSummary}
        >
          <div className={styles.courseIdentity}>
            <div className={styles.courseTitleRow}>
              <Heading level={3}>{course.name}</Heading>
              <Badge
                label={statusLabel(course.status)}
                variant={statusBadgeVariant(course.status)}
              />
              <div
                aria-label={`${courseLabel} 강좌 관리`}
                className={styles.courseActions}
                role='group'
              >
                <IconButton
                  icon={<Pencil aria-hidden='true' size={16} />}
                  label='강좌 정보 수정'
                  onClick={onEdit}
                  size='sm'
                  tooltip='강좌 정보 수정'
                  variant='ghost'
                />
                <IconButton
                  icon={<Trash2 aria-hidden='true' size={16} />}
                  label='강좌 삭제'
                  onClick={onDelete}
                  size='sm'
                  tooltip='강좌 삭제'
                  variant='ghost'
                />
              </div>
            </div>
          </div>
          <dl className={styles.courseMetadata}>
            <div className={styles.courseMetadataItem}>
              <dt className={styles.courseMetadataLabel}>운영 학기</dt>
              <dd className={styles.courseMetadataValue}>
                {course.year}년 {semesterLabel(course.semester)}
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
            <div className={styles.courseMetadataItem}>
              <dt className={styles.courseMetadataLabel}>담당 교수자</dt>
              <dd className={styles.courseMetadataValue}>
                {professorName ?? '확인 불가'}
              </dd>
            </div>
          </dl>
        </article>
      </Card>
      <div className={styles.sectionHeader}>
        <Heading level={3}>분반</Heading>
        <Button
          isDisabled={isSectionCreationDisabled}
          label='분반 등록'
          onClick={onCreateSection}
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
            aria-label={`${courseLabel} 분반 목록`}
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
  );
}
