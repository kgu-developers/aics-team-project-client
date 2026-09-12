import type { AdminRosterImportAppliedDto } from '@aics/api-client';
import type { CurrentUserSection, SectionResponse } from '@aics/core';
import { Button, Card, Heading, Text, VStack } from '@aics/design-system';
import { useMemo, useState } from 'react';

import EnrollmentImportDialog from '~/features/admin-student-team/components/EnrollmentImportDialog';
import TeamImportDialog from '~/features/admin-student-team/components/TeamImportDialog';
import { useAdminRosterImportStatusQueries } from '~/features/admin-student-team/queries';
import { useAuthStore } from '~/features/auth/authStore';

import { AdminPreSurveyResponses } from '~/widgets/admin-profile/AdminPreSurveyResponses';
import * as styles from '~/widgets/admin-profile/AdminProfilePage.css';
import { formatRosterImportAppliedAt } from '~/widgets/admin-profile/formatRosterImportAppliedAt';

type UploadFileKind = 'studentRoster' | 'teamRoster';
type UploadSection = { code: string; id: string; name: string };
type CourseUploadSection = CurrentUserSection &
  Required<
    Pick<
      SectionResponse,
      'courseId' | 'courseName' | 'semester' | 'status' | 'year'
    >
  >;
type CourseUploadGroup = {
  courseName: string;
  key: string;
  sections: CourseUploadSection[];
  semester: SectionResponse['semester'];
  year: number;
};

const emptySections: CurrentUserSection[] = [];

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

function semesterLabel(semester: SectionResponse['semester']) {
  return (
    {
      FALL: '2학기',
      SPRING: '1학기',
      SUMMER: '여름학기',
      WINTER: '겨울학기',
    }[semester] ?? semester
  );
}

function hasCourseDetails(
  section: CurrentUserSection,
): section is CourseUploadSection {
  return (
    typeof section.courseId === 'number' &&
    typeof section.courseName === 'string' &&
    typeof section.year === 'number' &&
    section.semester !== undefined &&
    section.status !== undefined
  );
}

function groupSectionsByCourse(
  sections: CurrentUserSection[],
): CourseUploadGroup[] {
  const grouped = new Map<string, CourseUploadGroup>();
  sections.filter(hasCourseDetails).forEach(section => {
    const key = `${section.courseId}:${section.year}:${section.semester}`;
    const course = grouped.get(key);
    if (course) {
      course.sections.push(section);
      return;
    }
    grouped.set(key, {
      courseName: section.courseName,
      key,
      sections: [section],
      semester: section.semester,
      year: section.year,
    });
  });
  return [...grouped.values()];
}

function getRosterImportStatusLabel(
  record: AdminRosterImportAppliedDto | null | undefined,
  isError: boolean,
  isPending: boolean,
) {
  if (isPending) return '불러오는 중입니다.';
  if (isError) return '업로드 현황을 불러오지 못했습니다.';
  if (!record || !record.fileName) return '파일 없음';
  return `${record.fileName} · ${formatRosterImportAppliedAt(record.appliedAt)}`;
}

function FileSelectionCard({
  kind,
  onOpen,
}: {
  kind: UploadFileKind;
  onOpen: () => void;
}) {
  const copy = uploadCopy[kind];
  return (
    <Card className={styles.uploadCard} padding={3} variant='muted'>
      <VStack gap={2}>
        <Heading level={3}>{copy.title}</Heading>
        <Text color='secondary' type='supporting'>
          {copy.description}
        </Text>
        <Button label={copy.label} onClick={onOpen} variant='primary' />
      </VStack>
    </Card>
  );
}

export default function AdminCourseOperations() {
  const currentUserSections =
    useAuthStore(state => state.currentUser?.sections) ?? emptySections;
  const [uploadKind, setUploadKind] = useState<UploadFileKind | null>(null);
  const [uploadCourseKey, setUploadCourseKey] = useState<string | null>(null);
  const [uploadSectionId, setUploadSectionId] = useState('');
  const uploadSections = currentUserSections.filter(hasCourseDetails);
  const courseUploadGroups = useMemo(
    () => groupSectionsByCourse(uploadSections),
    [uploadSections],
  );
  const selectedUploadCourse = courseUploadGroups.find(
    course => course.key === uploadCourseKey,
  );
  const selectedUploadSections: UploadSection[] = (
    selectedUploadCourse?.sections ?? []
  ).map(section => ({
    code: section.code,
    id: section.id,
    name: section.name,
  }));
  const rosterImportStatusQueries = useAdminRosterImportStatusQueries(
    uploadSections.map(section => section.id),
  );
  const rosterImportStatusBySectionId = new Map(
    rosterImportStatusQueries.map(({ query, sectionId }) => [sectionId, query]),
  );

  function openUploadDialog(kind: UploadFileKind, course: CourseUploadGroup) {
    const firstSection = course.sections[0];
    if (!firstSection) return;
    setUploadKind(kind);
    setUploadCourseKey(course.key);
    setUploadSectionId(String(firstSection.id));
  }

  function closeUploadDialog() {
    setUploadKind(null);
    setUploadCourseKey(null);
    setUploadSectionId('');
  }

  return (
    <>
      <Card className={styles.uploadSection} padding={4}>
        <VStack gap={4}>
          <header className={styles.sectionHeader}>
            <Heading level={2}>데이터 업로드</Heading>
            <Text color='secondary' type='supporting'>
              학생 명단과 팀 구성 명단은 분반별 Excel 파일로 관리합니다.
            </Text>
          </header>
          {uploadSections.length === 0 ? (
            <Text color='secondary' role='status'>
              담당 분반이 없어 명단 파일을 선택할 수 없습니다.
            </Text>
          ) : (
            <div className={styles.courseUploadGroups}>
              {courseUploadGroups.map(course => (
                <section className={styles.courseUploadGroup} key={course.key}>
                  <header className={styles.courseUploadHeader}>
                    <Heading level={3}>{course.courseName}</Heading>
                    <Text color='secondary' type='supporting'>
                      {course.year}년 {semesterLabel(course.semester)} · 분반{' '}
                      {course.sections.length}개
                    </Text>
                  </header>
                  <div className={styles.uploadGrid}>
                    <FileSelectionCard
                      kind='studentRoster'
                      onOpen={() => openUploadDialog('studentRoster', course)}
                    />
                    <FileSelectionCard
                      kind='teamRoster'
                      onOpen={() => openUploadDialog('teamRoster', course)}
                    />
                  </div>
                  <section
                    aria-label={`${course.courseName} 분반별 업로드 현황`}
                  >
                    <Heading level={4}>분반별 업로드 현황</Heading>
                    <div className={styles.statusGroups}>
                      {(['studentRoster', 'teamRoster'] as const).map(kind => (
                        <section key={kind}>
                          <Heading level={5}>{uploadCopy[kind].title}</Heading>
                          <ul className={styles.sectionStatusList}>
                            {course.sections.map(section => {
                              const statusQuery =
                                rosterImportStatusBySectionId.get(
                                  String(section.id),
                                );
                              return (
                                <li key={section.id}>
                                  <strong className={styles.sectionCode}>
                                    {section.code}
                                  </strong>
                                  <span className={styles.sectionFile}>
                                    {getRosterImportStatusLabel(
                                      statusQuery?.data?.[kind],
                                      statusQuery?.isError ?? false,
                                      statusQuery?.isPending ?? false,
                                    )}
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                        </section>
                      ))}
                    </div>
                  </section>
                </section>
              ))}
            </div>
          )}
        </VStack>
      </Card>

      <AdminPreSurveyResponses sections={currentUserSections} />

      <EnrollmentImportDialog
        isOpen={uploadKind === 'studentRoster' && uploadSectionId !== ''}
        onClose={closeUploadDialog}
        onSectionChange={setUploadSectionId}
        sectionId={uploadSectionId}
        sections={selectedUploadSections}
      />
      <TeamImportDialog
        isOpen={uploadKind === 'teamRoster' && uploadSectionId !== ''}
        onClose={closeUploadDialog}
        onSectionChange={setUploadSectionId}
        sectionId={uploadSectionId}
        sections={selectedUploadSections}
      />
    </>
  );
}
