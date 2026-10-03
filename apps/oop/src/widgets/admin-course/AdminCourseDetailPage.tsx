import type {
  AdminOopCourseDto,
  AdminOopSectionDto,
  AdminRosterImportAppliedDto,
} from '@aics/api-client';
import {
  Badge,
  BreadcrumbItem,
  Breadcrumbs,
  Button,
  Card,
  EmptyState,
  Heading,
  MetadataList,
  MetadataListItem,
  proportional,
  Selector,
  SelectorOption,
  Table,
  Text,
  useToast,
  type TableProps,
} from '@aics/design-system';
import { Link, useNavigate, useParams } from '@tanstack/react-router';
import {
  Fragment,
  forwardRef,
  useEffect,
  useMemo,
  useState,
  type ComponentPropsWithoutRef,
  type ReactElement,
} from 'react';

import { ROUTES } from '~/app/constants/routes';

import { cx } from '~/shared/lib/cx';

import {
  CourseDeleteDialog,
  CourseFormDialog,
  SectionAssistantManagement,
  SectionCreateDialog,
  SectionSettingsDialog,
} from '~/features/admin-course/components/AdminCourseDialogs';
import {
  contactVisibilityBadgeVariant,
  contactVisibilityStatus,
  semesterLabel,
  statusBadgeVariant,
  statusLabel,
} from '~/features/admin-course/model/courseLabels';
import { useAdminOopCourseQuery } from '~/features/admin-course/queries';
import { useAdminOopSectionsQuery } from '~/features/admin-section/queries';
import EnrollmentImportDialog from '~/features/admin-student-team/components/EnrollmentImportDialog';
import TeamImportDialog from '~/features/admin-student-team/components/TeamImportDialog';
import {
  useAdminRosterImportStatusQuery,
  useAdminRosterImportStatusQueries,
  useAdminSectionEnrollmentsQuery,
} from '~/features/admin-student-team/queries';
import { useAuthStore } from '~/features/auth/authStore';
import { fetchSessionUser } from '~/features/auth/fetchSessionUser';

import { AdminPreSurveyResponses } from '~/widgets/admin-profile/AdminPreSurveyResponses';
import { formatRosterImportAppliedAt } from '~/widgets/admin-profile/formatRosterImportAppliedAt';

import * as styles from './AdminCourseDetailPage.css';
import { AdminSectionArtifactSummary } from './AdminSectionArtifactSummary';
import {
  getAdminCourseDetailOperationOrder,
  type AdminCourseDetailOperationPanel,
} from './getAdminCourseDetailOperationOrder';

type SectionTablePlugin = NonNullable<
  TableProps<AdminOopSectionDto>['plugins']
>[string];
type UploadFileKind = 'studentRoster' | 'teamRoster';

const uploadCopy: Record<
  UploadFileKind,
  { description: string; label: string; title: string }
> = {
  studentRoster: {
    description: '학번 필수, 이름·이메일·전화번호·역할 선택 Excel (.xls/.xlsx)',
    label: '학생 명단 파일 선택',
    title: '학생 명단',
  },
  teamRoster: {
    description: '팀명·학번 필수, 이름·팀장·역할 등 선택 Excel (.xls/.xlsx)',
    label: '팀 구성 명단 파일 선택',
    title: '팀 구성 명단',
  },
};

function rosterImportStatusLabel(
  record: AdminRosterImportAppliedDto | null | undefined,
  isError: boolean,
  isPending: boolean,
) {
  if (isPending) return '불러오는 중';
  if (isError) return '조회 실패';
  if (!record || !record.fileName) return '파일 없음';
  return `${record.fileName} · ${formatRosterImportAppliedAt(record.appliedAt)}`;
}

type CourseBreadcrumbLinkProps = Omit<
  ComponentPropsWithoutRef<typeof Link>,
  'to'
> & { href: string };

// BreadcrumbItem speaks `href`; TanStack Router speaks `to`. Bridge here.
const CourseBreadcrumbLink = forwardRef<
  HTMLAnchorElement,
  CourseBreadcrumbLinkProps
>(function CourseBreadcrumbLink({ href, ...props }, ref) {
  return <Link ref={ref} to={href as '/admin/sections'} {...props} />;
});

function AssistantCount({ sectionId }: { sectionId: string }) {
  const enrollmentsQuery = useAdminSectionEnrollmentsQuery(sectionId);
  if (enrollmentsQuery.isPending) return <>확인 중</>;
  if (enrollmentsQuery.isError) return <>조회 실패</>;
  const count = (enrollmentsQuery.data?.contents ?? []).filter(
    enrollment =>
      enrollment.role === 'ASSISTANT' && enrollment.status === 'ACTIVE',
  ).length;
  return <>{count === 0 ? '없음' : `${count}명`}</>;
}

function CourseSummary({
  course,
  onDelete,
  onEdit,
}: {
  course: AdminOopCourseDto;
  onDelete: () => void;
  onEdit: () => void;
}) {
  return (
    <Card className={styles.summaryCard} padding={5}>
      <div className={styles.summaryHeader}>
        <div className={styles.summaryTitle}>
          <Heading level={1}>{course.name}</Heading>
          <Badge
            label={statusLabel(course.status)}
            variant={statusBadgeVariant(course.status)}
          />
        </div>
        <div className={styles.summaryActions}>
          <Button label='강좌 정보 수정' onClick={onEdit} variant='secondary' />
          <Button label='강좌 삭제' onClick={onDelete} variant='ghost' />
        </div>
      </div>
      <MetadataList>
        <MetadataListItem label='연도'>{course.year}년</MetadataListItem>
        <MetadataListItem label='학기'>
          {semesterLabel(course.semester)}
        </MetadataListItem>
        <MetadataListItem label='운영 상태'>
          {statusLabel(course.status)}
        </MetadataListItem>
      </MetadataList>
    </Card>
  );
}

function CourseOperationPanels({
  dataUploadPanel,
  initialSectionId,
  sections,
}: {
  dataUploadPanel: ReactElement;
  initialSectionId: string | undefined;
  sections: AdminOopSectionDto[];
}) {
  const rosterStatusQuery = useAdminRosterImportStatusQuery(initialSectionId);
  const fallbackOperationOrder: readonly AdminCourseDetailOperationPanel[] = [
    'preSurvey',
    'dataUpload',
    'artifactSummary',
  ];
  const operationOrder = rosterStatusQuery.isSuccess
    ? getAdminCourseDetailOperationOrder({
        hasStudentRoster: Boolean(
          rosterStatusQuery.data.studentRoster?.fileName,
        ),
        hasTeamRoster: Boolean(rosterStatusQuery.data.teamRoster?.fileName),
      })
    : fallbackOperationOrder;
  const rosterStatusNotice = rosterStatusQuery.isPending
    ? '명단 업로드 상태를 확인하는 중입니다. 확인이 끝나면 상태에 따라 영역 순서를 조정합니다.'
    : rosterStatusQuery.isError
      ? '명단 업로드 상태를 확인하지 못했습니다. 기본 영역 순서로 표시되며, 잠시 후 다시 확인해 주세요.'
      : null;
  const operationSections = sections.map(section => ({
    code: section.code,
    id: String(section.id),
    name: section.name,
  }));
  const operationPanels: Record<AdminCourseDetailOperationPanel, ReactElement> =
    {
      artifactSummary: (
        <AdminSectionArtifactSummary
          initialSectionId={initialSectionId}
          sections={operationSections}
        />
      ),
      dataUpload: dataUploadPanel,
      preSurvey: (
        <AdminPreSurveyResponses
          initialSectionId={initialSectionId}
          isRosterStatusResolved={rosterStatusQuery.isSuccess}
          isTeamRosterImported={Boolean(
            rosterStatusQuery.data?.teamRoster?.fileName,
          )}
          sections={operationSections}
        />
      ),
    };

  return (
    <>
      {rosterStatusNotice ? (
        <Text color='secondary' role='status' type='supporting'>
          {rosterStatusNotice}
        </Text>
      ) : null}
      {operationOrder.map(panel => (
        <Fragment key={panel}>{operationPanels[panel]}</Fragment>
      ))}
    </>
  );
}

export default function AdminCourseDetailPage({
  initialSectionId,
}: {
  initialSectionId?: string;
}) {
  const navigate = useNavigate({ from: '/admin/sections/$courseId' });
  const toast = useToast();
  const { courseId } = useParams({ from: '/admin/sections/$courseId' });
  const currentUser = useAuthStore(state => state.currentUser);
  const sessionRole = useAuthStore(state => state.sessionRole);
  const setCurrentUser = useAuthStore(state => state.setCurrentUser);
  const numericCourseId = /^\d+$/.test(courseId) ? Number(courseId) : undefined;
  const courseQuery = useAdminOopCourseQuery(numericCourseId);
  const sectionsQuery = useAdminOopSectionsQuery(
    numericCourseId === undefined ? undefined : { courseId: numericCourseId },
  );
  const sections = useMemo(
    () => sectionsQuery.data?.contents ?? [],
    [sectionsQuery.data],
  );
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isCreateSectionOpen, setIsCreateSectionOpen] = useState(false);
  const [sectionToEdit, setSectionToEdit] = useState<AdminOopSectionDto | null>(
    null,
  );
  const [assistantSection, setAssistantSection] =
    useState<AdminOopSectionDto | null>(null);
  const [uploadKind, setUploadKind] = useState<UploadFileKind | null>(null);
  const [uploadSectionId, setUploadSectionId] = useState('');
  const [detailSectionId, setDetailSectionId] = useState<string | undefined>(
    initialSectionId,
  );

  const rosterImportStatusQueries = useAdminRosterImportStatusQueries(
    sections.map(section => String(section.id)),
  );
  const rosterStatusBySectionId = new Map(
    sections.map((section, index) => [
      String(section.id),
      rosterImportStatusQueries[index],
    ]),
  );
  const sectionIds = sections.map(section => String(section.id));
  const sectionIdsKey = sectionIds.join('|');
  const hasValidInitialSectionId =
    initialSectionId !== undefined && sectionIds.includes(initialSectionId);

  useEffect(() => {
    if (hasValidInitialSectionId) {
      setDetailSectionId(initialSectionId);
      return;
    }

    setDetailSectionId(currentSectionId => {
      if (currentSectionId && sectionIds.includes(currentSectionId)) {
        return currentSectionId;
      }

      return sections.length === 1 ? sectionIds[0] : undefined;
    });
  }, [
    hasValidInitialSectionId,
    initialSectionId,
    sectionIdsKey,
    sections.length,
  ]);

  useEffect(() => {
    if (
      hasValidInitialSectionId ||
      sections.length !== 1 ||
      detailSectionId !== sectionIds[0]
    )
      return;

    void navigate({
      replace: true,
      search: previous => ({
        ...previous,
        sectionId: Number(detailSectionId),
      }),
    });
  }, [
    detailSectionId,
    hasValidInitialSectionId,
    navigate,
    sectionIdsKey,
    sections.length,
  ]);

  const detailSection = detailSectionId
    ? sections.find(section => String(section.id) === detailSectionId)
    : undefined;

  function selectDetailSection(nextSectionId: string) {
    setDetailSectionId(nextSectionId);
    void navigate({
      search: previous => ({
        ...previous,
        sectionId: Number(nextSectionId),
      }),
    });
  }

  async function refreshCurrentUserSections() {
    if (!sessionRole) return false;
    try {
      setCurrentUser(await fetchSessionUser(sessionRole));
      return true;
    } catch {
      toast({ body: '분반 목록을 새로고침하지 못했습니다.' });
      return false;
    }
  }

  async function refreshSectionsAndSession() {
    const sectionResult = await sectionsQuery.refetch();
    const sessionRefreshed = await refreshCurrentUserSections();
    return !sectionResult.isError && sessionRefreshed;
  }

  const sectionRowPlugin = useMemo<SectionTablePlugin>(
    () => ({
      transformBodyRow: (rowRenderProps, section) => {
        const onClick = rowRenderProps.htmlProps.onClick;
        const onKeyDown = rowRenderProps.htmlProps.onKeyDown;
        const open = () => setSectionToEdit(section);
        return {
          ...rowRenderProps,
          htmlProps: {
            ...rowRenderProps.htmlProps,
            'aria-label': `${section.code} 분반 설정`,
            className: cx(
              rowRenderProps.htmlProps.className,
              styles.clickableRow,
            ),
            onClick: event => {
              onClick?.(event);
              if (event.defaultPrevented) return;
              // Buttons inside the row (조교 관리) own their own action.
              if (
                event.target instanceof Element &&
                event.target.closest('button, a')
              )
                return;
              open();
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
              open();
            },
            tabIndex: 0,
          },
        };
      },
    }),
    [],
  );

  const uploadSections = sections.map(section => ({
    code: section.code,
    id: String(section.id),
    name: section.name,
  }));

  function openUpload(kind: UploadFileKind) {
    const first = sections[0];
    if (!first) return;
    setUploadKind(kind);
    setUploadSectionId(String(first.id));
  }

  function closeUpload() {
    setUploadKind(null);
    setUploadSectionId('');
  }

  if (numericCourseId === undefined || courseQuery.isError) {
    return (
      <div className={styles.page}>
        <EmptyState
          actions={
            <Button
              label='강좌 목록으로'
              onClick={() => void navigate({ to: ROUTES.ADMIN_SECTIONS })}
              variant='secondary'
            />
          }
          description='강좌가 삭제되었거나 주소가 올바르지 않습니다.'
          title='강좌를 찾을 수 없습니다.'
        />
      </div>
    );
  }
  if (courseQuery.isPending) {
    return (
      <div className={styles.page}>
        <Text aria-live='polite' role='status'>
          강좌 정보를 불러오는 중입니다.
        </Text>
      </div>
    );
  }
  const course = courseQuery.data;
  const isOperationPanelReady =
    !sectionsQuery.isPending && !sectionsQuery.isError;
  const dataUploadPanel = (
    <section aria-labelledby='course-upload-title' className={styles.block}>
      <div className={styles.blockHeader}>
        <div>
          <Heading id='course-upload-title' level={2}>
            데이터 업로드
          </Heading>
          <Text color='secondary' type='supporting'>
            학생 명단과 팀 구성 명단은 분반별 Excel 파일로 관리합니다.
          </Text>
        </div>
      </div>
      {sections.length === 0 ? (
        <Text color='secondary' role='status'>
          분반을 먼저 등록하면 명단 파일을 업로드할 수 있습니다.
        </Text>
      ) : (
        <>
          <div className={styles.uploadGrid}>
            {(['studentRoster', 'teamRoster'] as const).map(kind => (
              <Card key={kind} padding={4} variant='muted'>
                <div className={styles.uploadCard}>
                  <div className={styles.uploadCopy}>
                    <Text as='p' display='block' weight='medium'>
                      {uploadCopy[kind].title}
                    </Text>
                    <Text
                      as='p'
                      color='secondary'
                      display='block'
                      type='supporting'
                    >
                      {uploadCopy[kind].description}
                    </Text>
                  </div>
                  <Button
                    label={uploadCopy[kind].label}
                    onClick={() => openUpload(kind)}
                    size='sm'
                    variant='secondary'
                  />
                </div>
              </Card>
            ))}
          </div>
          <Card padding={0}>
            <Table
              aria-label='분반별 업로드 현황'
              columns={[
                {
                  align: 'start',
                  header: '분반',
                  key: 'code',
                  width: proportional(0.7, { minWidth: 100 }),
                },
                {
                  align: 'start',
                  header: '학생 명단',
                  key: 'classTime',
                  renderCell: section => {
                    const query = rosterStatusBySectionId.get(
                      String(section.id),
                    );
                    return rosterImportStatusLabel(
                      query?.data?.studentRoster,
                      query?.isError ?? false,
                      query?.isPending ?? false,
                    );
                  },
                  width: proportional(1.5, { minWidth: 200 }),
                },
                {
                  align: 'start',
                  header: '팀 구성 명단',
                  key: 'capacity',
                  renderCell: section => {
                    const query = rosterStatusBySectionId.get(
                      String(section.id),
                    );
                    return rosterImportStatusLabel(
                      query?.data?.teamRoster,
                      query?.isError ?? false,
                      query?.isPending ?? false,
                    );
                  },
                  width: proportional(1.5, { minWidth: 200 }),
                },
              ]}
              data={sections}
              dividers='rows'
              idKey='id'
              textOverflow='wrap'
              verticalAlign='middle'
            />
          </Card>
        </>
      )}
    </section>
  );
  return (
    <div className={styles.page}>
      <Breadcrumbs label='강좌 경로'>
        <BreadcrumbItem as={CourseBreadcrumbLink} href={ROUTES.ADMIN_SECTIONS}>
          강좌·분반 관리
        </BreadcrumbItem>
        <BreadcrumbItem isCurrent>{course.name}</BreadcrumbItem>
      </Breadcrumbs>

      <CourseSummary
        course={course}
        onDelete={() => setIsDeleteOpen(true)}
        onEdit={() => setIsEditOpen(true)}
      />

      <section aria-labelledby='course-sections-title' className={styles.block}>
        <div className={styles.blockHeader}>
          <div>
            <Heading id='course-sections-title' level={2}>
              분반
            </Heading>
            <Text color='secondary' type='supporting'>
              행을 선택하면 분반 정보와 온보딩 기간을 수정할 수 있습니다.
            </Text>
          </div>
          <Button
            isDisabled={!currentUser?.studentNumber}
            label='분반 등록'
            onClick={() => setIsCreateSectionOpen(true)}
          />
        </div>
        {sectionsQuery.isPending ? (
          <Text aria-live='polite' role='status'>
            연결된 분반을 불러오는 중입니다.
          </Text>
        ) : sectionsQuery.isError ? (
          <EmptyState
            description='잠시 후 다시 시도해 주세요.'
            title='연결된 분반을 불러오지 못했습니다.'
          />
        ) : sections.length === 0 ? (
          <EmptyState
            description='분반을 등록하면 학생 명단과 팀을 관리할 수 있습니다.'
            title='등록된 분반이 없습니다.'
          />
        ) : (
          <Card padding={0}>
            <Table
              aria-label='연결된 분반 목록'
              columns={[
                {
                  align: 'start',
                  header: '분반 코드',
                  key: 'code',
                  width: proportional(0.9, { minWidth: 110 }),
                },
                {
                  align: 'start',
                  header: '수업 시간',
                  key: 'classTime',
                  width: proportional(1.2, { minWidth: 140 }),
                },
                {
                  align: 'start',
                  header: '정원',
                  key: 'capacity',
                  renderCell: section => `${section.capacity}명`,
                  width: proportional(0.6, { minWidth: 72 }),
                },
                {
                  align: 'start',
                  header: '온보딩 기간',
                  key: 'contactVisibleFrom',
                  renderCell: section => {
                    const status = contactVisibilityStatus(
                      section.contactVisibleFrom,
                      section.contactVisibleUntil,
                    );
                    return (
                      <Badge
                        label={status}
                        variant={contactVisibilityBadgeVariant(status)}
                      />
                    );
                  },
                  width: proportional(0.9, { minWidth: 120 }),
                },
                {
                  align: 'start',
                  header: '조교',
                  key: 'id',
                  renderCell: section => (
                    <span className={styles.assistantCell}>
                      <AssistantCount sectionId={String(section.id)} />
                      <Button
                        label='조교 관리'
                        onClick={() => setAssistantSection(section)}
                        size='sm'
                        variant='ghost'
                      />
                    </span>
                  ),
                  width: proportional(1, { minWidth: 150 }),
                },
                {
                  align: 'start',
                  header: '수강생',
                  key: 'name',
                  renderCell: section => (
                    <Button
                      label='수강생 관리'
                      onClick={() =>
                        void navigate({
                          to: ROUTES.ADMIN_STUDENT_TEAM,
                          search: { sectionId: section.id },
                        })
                      }
                      size='sm'
                      variant='secondary'
                    />
                  ),
                  width: proportional(0.8, { minWidth: 130 }),
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

      {isOperationPanelReady ? (
        <>
          {sections.length > 1 ? (
            <Card padding={3}>
              <Selector
                label='화면 기준 분반'
                onChange={selectDetailSection}
                options={sections.map(section => ({
                  label: `${section.code} (${section.name})`,
                  value: String(section.id),
                }))}
                placeholder='분반을 선택해 주세요'
                renderOption={option => (
                  <SelectorOption label={option.label ?? option.value} />
                )}
                value={detailSectionId ?? ''}
                width='100%'
              />
              <Text color='secondary' type='supporting'>
                선택한 분반의 명단 업로드 상태를 기준으로 화면 영역 순서를
                정합니다.
              </Text>
            </Card>
          ) : null}

          {detailSection ? (
            <>
              <Text color='secondary' type='supporting'>
                현재 영역 배치는 {detailSection.code} 분반의 명단 업로드 상태를
                기준으로 합니다. 각 영역의 분반 선택은 조회·다운로드 대상만
                바꿉니다.
              </Text>

              <CourseOperationPanels
                dataUploadPanel={dataUploadPanel}
                initialSectionId={detailSectionId}
                sections={sections}
              />
            </>
          ) : sections.length > 1 ? (
            <Text color='secondary' role='status'>
              분반을 선택하면 해당 분반의 운영 현황을 표시합니다.
            </Text>
          ) : null}
        </>
      ) : null}

      <CourseFormDialog
        courseId={course.id}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
      />
      <CourseDeleteDialog
        course={isDeleteOpen ? course : null}
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onDeleted={() => void navigate({ to: ROUTES.ADMIN_SECTIONS })}
      />
      <SectionCreateDialog
        course={course}
        isOpen={isCreateSectionOpen}
        onClose={() => setIsCreateSectionOpen(false)}
        onCreated={refreshSectionsAndSession}
        professorId={currentUser?.studentNumber}
      />
      <SectionSettingsDialog
        isOpen={sectionToEdit !== null}
        onClose={() => setSectionToEdit(null)}
        onDeleted={refreshSectionsAndSession}
        onSaved={refreshSectionsAndSession}
        section={sectionToEdit}
      />
      {assistantSection ? (
        <SectionAssistantManagement
          isOpen
          onClose={() => setAssistantSection(null)}
          section={assistantSection}
        />
      ) : null}
      <EnrollmentImportDialog
        isOpen={uploadKind === 'studentRoster' && uploadSectionId !== ''}
        onClose={closeUpload}
        onSectionChange={setUploadSectionId}
        sectionId={uploadSectionId}
        sections={uploadSections}
      />
      <TeamImportDialog
        isOpen={uploadKind === 'teamRoster' && uploadSectionId !== ''}
        onClose={closeUpload}
        onSectionChange={setUploadSectionId}
        sectionId={uploadSectionId}
        sections={uploadSections}
      />
    </div>
  );
}
