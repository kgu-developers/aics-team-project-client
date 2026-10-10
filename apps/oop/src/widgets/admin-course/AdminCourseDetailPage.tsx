import type {
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
  proportional,
  Selector,
  SelectorOption,
  Tab,
  TabList,
  Table,
  Text,
  useToast,
} from '@aics/design-system';
import { Link, useNavigate, useParams } from '@tanstack/react-router';
import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentPropsWithoutRef,
} from 'react';

import { ROUTES } from '~/app/constants/routes';

import {
  SectionAssistantManagement,
  SectionSettingsDialog,
} from '~/features/admin-course/components/AdminCourseDialogs';
import {
  contactVisibilityBadgeVariant,
  contactVisibilityStatus,
} from '~/features/admin-course/model/courseLabels';
import { useAdminOopCourseQuery } from '~/features/admin-course/queries';
import { useAdminOopSectionsQuery } from '~/features/admin-section/queries';
import EnrollmentImportDialog from '~/features/admin-student-team/components/EnrollmentImportDialog';
import TeamImportDialog from '~/features/admin-student-team/components/TeamImportDialog';
import {
  useAdminRosterImportStatusQuery,
  useAdminSectionEnrollmentsQuery,
} from '~/features/admin-student-team/queries';
import { useAuthStore } from '~/features/auth/authStore';
import { fetchSessionUser } from '~/features/auth/fetchSessionUser';

import { AdminPreSurveyResponses } from '~/widgets/admin-profile/AdminPreSurveyResponses';
import { formatRosterImportAppliedAt } from '~/widgets/admin-profile/formatRosterImportAppliedAt';
import AdminStudentTeamManagement from '~/widgets/admin-student-team/AdminStudentTeamManagement';

import * as styles from './AdminCourseDetailPage.css';
import AdminSectionScheduleTable from './AdminSectionScheduleTable';

type UploadFileKind = 'studentRoster' | 'teamRoster';
export type AdminCourseDetailTab = 'basic' | 'roster' | 'survey';

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

export default function AdminCourseDetailPage({
  initialSectionId,
  initialTab = 'basic',
}: {
  initialSectionId?: string;
  initialTab?: AdminCourseDetailTab;
}) {
  const navigate = useNavigate({ from: '/admin/sections/$courseId' });
  const toast = useToast();
  const { courseId } = useParams({ from: '/admin/sections/$courseId' });
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
  const [sectionToEdit, setSectionToEdit] = useState<AdminOopSectionDto | null>(
    null,
  );
  const [assistantSection, setAssistantSection] =
    useState<AdminOopSectionDto | null>(null);
  const [uploadKind, setUploadKind] = useState<UploadFileKind | null>(null);
  const [uploadSectionId, setUploadSectionId] = useState('');
  const [activeTab, setActiveTab] = useState<AdminCourseDetailTab>(initialTab);
  const [detailSectionId, setDetailSectionId] = useState<string | undefined>(
    initialSectionId,
  );

  const sectionIds = sections.map(section => String(section.id));
  const sectionIdsKey = sectionIds.join('|');

  useEffect(() => {
    if (!sectionsQuery.isSuccess) return;

    const nextSectionId =
      initialSectionId !== undefined && sectionIds.includes(initialSectionId)
        ? initialSectionId
        : undefined;

    setDetailSectionId(nextSectionId);
    if (initialSectionId === undefined || nextSectionId !== undefined) return;

    void navigate({
      replace: true,
      search: previous => ({
        ...previous,
        sectionId: undefined,
      }),
    });
  }, [initialSectionId, navigate, sectionIdsKey, sectionsQuery.isSuccess]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialSectionId, initialTab]);

  const detailSection = detailSectionId
    ? sections.find(section => String(section.id) === detailSectionId)
    : undefined;
  const detailRosterStatusQuery =
    useAdminRosterImportStatusQuery(detailSectionId);

  const selectDetailSection = useCallback(
    (nextSectionId: string, nextTab: AdminCourseDetailTab = 'basic') => {
      setDetailSectionId(nextSectionId);
      setActiveTab(nextTab);
      void navigate({
        search: previous => ({
          ...previous,
          sectionId: Number(nextSectionId),
          tab: nextTab === 'basic' ? undefined : nextTab,
        }),
      });
    },
    [navigate],
  );

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

  const selectedCourseSections = detailSection ? [detailSection] : [];
  const uploadSections = selectedCourseSections.map(section => ({
    code: section.code,
    id: String(section.id),
    name: section.name,
  }));

  function openUpload(kind: UploadFileKind) {
    if (!detailSection) return;
    setUploadKind(kind);
    setUploadSectionId(String(detailSection.id));
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
  if (sectionsQuery.isPending) {
    return (
      <div className={styles.page}>
        <Text aria-live='polite' role='status'>
          분반 정보를 불러오는 중입니다.
        </Text>
      </div>
    );
  }
  if (sectionsQuery.isError) {
    return (
      <div className={styles.page}>
        <EmptyState
          description='잠시 후 다시 시도해 주세요.'
          title='분반 정보를 불러오지 못했습니다.'
        />
      </div>
    );
  }
  if (!detailSection) {
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
          description='분반이 삭제되었거나 주소가 올바르지 않습니다.'
          title='분반을 찾을 수 없습니다.'
        />
      </div>
    );
  }
  const hasImportedBothRosters = Boolean(
    detailRosterStatusQuery.data?.studentRoster?.fileName &&
    detailRosterStatusQuery.data?.teamRoster?.fileName,
  );
  const dataUploadPanel = (
    <section aria-labelledby='course-upload-title' className={styles.block}>
      <div className={styles.blockHeader}>
        <div>
          <Heading id='course-upload-title' level={2}>
            데이터 업로드
          </Heading>
        </div>
      </div>
      {selectedCourseSections.length === 0 ? (
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
                  renderCell: () =>
                    rosterImportStatusLabel(
                      detailRosterStatusQuery.data?.studentRoster,
                      detailRosterStatusQuery.isError,
                      detailRosterStatusQuery.isPending,
                    ),
                  width: proportional(1.5, { minWidth: 200 }),
                },
                {
                  align: 'start',
                  header: '팀 구성 명단',
                  key: 'capacity',
                  renderCell: () =>
                    rosterImportStatusLabel(
                      detailRosterStatusQuery.data?.teamRoster,
                      detailRosterStatusQuery.isError,
                      detailRosterStatusQuery.isPending,
                    ),
                  width: proportional(1.5, { minWidth: 200 }),
                },
              ]}
              data={selectedCourseSections}
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
        <BreadcrumbItem isCurrent>{detailSection.code} 분반</BreadcrumbItem>
      </Breadcrumbs>

      <header className={styles.pageHeader}>
        <div className={styles.pageTitle}>
          <Heading level={1}>{detailSection.code} 분반</Heading>
        </div>
      </header>

      {detailSection && sections.length > 1 ? (
        <div className={styles.sectionSelector}>
          <Selector
            label='현재 분반'
            onChange={selectDetailSection}
            options={sections.map(section => ({
              label: `${section.code} (${section.name})`,
              value: String(section.id),
            }))}
            renderOption={option => (
              <SelectorOption label={option.label ?? option.value} />
            )}
            value={detailSectionId ?? ''}
            width='100%'
          />
        </div>
      ) : null}

      {detailSection ? (
        <TabList
          aria-label='강좌·분반 관리 메뉴'
          onChange={value => {
            if (value === 'basic' || value === 'roster' || value === 'survey') {
              setActiveTab(value);
              void navigate({
                search: previous => ({
                  ...previous,
                  tab: value === 'basic' ? undefined : value,
                }),
              });
            }
          }}
          value={activeTab}
        >
          <Tab label='기본 설정' value='basic' />
          <Tab label='학생·팀 구성' value='roster' />
          <Tab label='사전 정보' value='survey' />
        </TabList>
      ) : null}

      {detailSection && activeTab === 'basic' ? (
        <>
          <section
            aria-labelledby='section-settings-title'
            className={styles.block}
          >
            <div className={styles.blockHeader}>
              <div>
                <Heading id='section-settings-title' level={2}>
                  분반 기본 설정
                </Heading>
              </div>
              <Button
                label='분반 설정'
                onClick={() => setSectionToEdit(detailSection)}
                variant='secondary'
              />
            </div>
            <Card padding={0}>
              <Table
                aria-label='선택한 분반 기본 설정'
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
                ]}
                data={[detailSection]}
                dividers='rows'
                idKey='id'
                verticalAlign='middle'
              />
            </Card>
          </section>

          <AdminSectionScheduleTable sectionId={String(detailSection.id)} />
        </>
      ) : null}

      {detailSection && activeTab === 'roster' ? (
        <>
          {!hasImportedBothRosters ? dataUploadPanel : null}
          <AdminStudentTeamManagement
            initialSectionId={String(detailSection.id)}
            isEmbedded
            showSectionFilter={false}
          />
          {hasImportedBothRosters ? dataUploadPanel : null}
        </>
      ) : null}

      {detailSection && activeTab === 'survey' ? (
        <AdminPreSurveyResponses
          initialSectionId={String(detailSection.id)}
          sections={uploadSections}
          showSectionSelector={false}
        />
      ) : null}

      {sectionToEdit ? (
        <SectionSettingsDialog
          isOpen
          onClose={() => setSectionToEdit(null)}
          onDeleted={refreshSectionsAndSession}
          onSaved={refreshSectionsAndSession}
          section={sectionToEdit}
        />
      ) : null}
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
