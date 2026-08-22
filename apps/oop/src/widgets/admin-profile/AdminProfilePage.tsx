import {
  Button,
  Card,
  FileInput,
  Heading,
  Text,
  TextArea,
  TextInput,
  VStack,
} from '@aics/design-system';
import { useEffect, useState } from 'react';

import { useAuthStore } from '~/features/auth/authStore';
import {
  useAdminProfileQuery,
  useUpdateAdminProfileMutation,
} from '~/features/admin-profile/queries';

import * as styles from './AdminProfilePage.css';

type UploadFileKind = 'studentRoster' | 'teamRoster';

const uploadCopy: Record<
  UploadFileKind,
  { description: string; label: string; title: string }
> = {
  studentRoster: {
    description:
      '학번, 이름, 소속(전공), 학년, 학적 구분, 이메일 컬럼 포함 Excel (.xlsx)',
    label: '학생 명단 파일 선택',
    title: '학생 명단',
  },
  teamRoster: {
    description: '팀명, 학번 컬럼 포함 Excel (.xlsx)',
    label: '팀 구성 명단 파일 선택',
    title: '팀 구성 명단',
  },
};

function FileSelectionCard({
  file,
  kind,
  onChange,
}: {
  file: File | null;
  kind: UploadFileKind;
  onChange: (file: File | null) => void;
}) {
  const copy = uploadCopy[kind];

  return (
    <Card className={styles.uploadCard} padding={3} variant='muted'>
      <VStack gap={2}>
        <Heading level={3}>{copy.title}</Heading>
        <Text color='secondary' type='supporting'>
          {copy.description}
        </Text>
        <FileInput
          accept='.xlsx'
          label={copy.label}
          mode='input'
          onChange={selected => {
            const nextFile = Array.isArray(selected) ? selected[0] : selected;
            onChange(nextFile ?? null);
          }}
          placeholder='Excel 파일 선택'
          value={file}
          width='100%'
        />
        {file ? (
          <Text color='secondary' role='status' type='supporting'>
            {file.name} 선택됨 · 아직 업로드되지 않았습니다.
          </Text>
        ) : null}
      </VStack>
    </Card>
  );
}

export default function AdminProfilePage() {
  const currentUser = useAuthStore(state => state.currentUser);
  const [message, setMessage] = useState('');
  const [studentRosterFile, setStudentRosterFile] = useState<File | null>(null);
  const [teamRosterFile, setTeamRosterFile] = useState<File | null>(null);
  const sections = currentUser?.sections ?? [];
  const profileQuery = useAdminProfileQuery();
  const updateProfileMutation = useUpdateAdminProfileMutation();

  useEffect(() => {
    setMessage(profileQuery.data?.introduction ?? '');
  }, [profileQuery.data?.introduction]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateProfileMutation.mutate({ introduction: message });
  }

  return (
    <div className={styles.page}>
      <Heading level={1}>마이페이지</Heading>

      <Card className={styles.profileCard} padding={4}>
        <VStack gap={4}>
          <header className={styles.sectionHeader}>
            <Heading level={2}>프로필 정보</Heading>
            <Text color='secondary' type='supporting'>
              학생 화면에서 교수 상세보기로 노출될 정보입니다. 이름, 이메일,
              간단한 메시지를 입력해 주세요.
            </Text>
          </header>

          <form className={styles.profileForm} onSubmit={handleSubmit}>
            <TextInput
              label='이름'
              isDisabled
              value={currentUser?.name ?? ''}
              width='100%'
            />
            <TextInput
              label='이메일'
              isDisabled
              type='email'
              value={currentUser?.email ?? ''}
              width='100%'
            />
            <TextArea
              label='간단한 메시지'
              onChange={setMessage}
              placeholder='예) 안녕하세요. OOP 팀프로젝트를 담당하는 교수자입니다. 궁금한 점은 쪽지로 남겨주세요.'
              value={message}
              width='100%'
            />
            <Text color='secondary' type='supporting'>
              학생들에게 노출되는 소개 메시지입니다.
            </Text>
            <div className={styles.actions}>
              <Button
                isDisabled={
                  profileQuery.isLoading || updateProfileMutation.isPending
                }
                label='저장하기'
                type='submit'
                variant='primary'
              />
            </div>
            {profileQuery.isError ? (
              <Text role='alert'>
                소개 메시지를 불러오지 못했습니다. 저장하면 다시 시도합니다.
              </Text>
            ) : null}
            {updateProfileMutation.isSuccess ? (
              <Text role='status'>소개 메시지를 저장했습니다.</Text>
            ) : null}
            {updateProfileMutation.isError ? (
              <Text role='alert'>
                소개 메시지를 저장하지 못했습니다. 다시 시도해 주세요.
              </Text>
            ) : null}
          </form>
        </VStack>
      </Card>

      <Card className={styles.uploadSection} padding={4}>
        <VStack gap={4}>
          <header className={styles.sectionHeader}>
            <Heading level={2}>데이터 업로드</Heading>
            <Text color='secondary' type='supporting'>
              학생 명단과 팀 구성 명단은 분반별 Excel 파일로 관리합니다.
            </Text>
          </header>

          <div className={styles.uploadGrid}>
            <FileSelectionCard
              file={studentRosterFile}
              kind='studentRoster'
              onChange={setStudentRosterFile}
            />
            <FileSelectionCard
              file={teamRosterFile}
              kind='teamRoster'
              onChange={setTeamRosterFile}
            />
          </div>

          <section aria-labelledby='section-upload-status'>
            <Heading id='section-upload-status' level={3}>
              분반별 업로드 현황
            </Heading>
            {sections.length === 0 ? (
              <Text color='secondary'>담당 분반 정보를 찾을 수 없습니다.</Text>
            ) : (
              <div className={styles.statusGroups}>
                {(['studentRoster', 'teamRoster'] as const).map(kind => (
                  <section key={kind}>
                    <Heading level={4}>{uploadCopy[kind].title}</Heading>
                    <ul className={styles.sectionStatusList}>
                      {sections.map(section => (
                        <li key={section.id}>
                          <strong>{section.code}</strong>
                          <span>
                            {(
                              kind === 'studentRoster'
                                ? studentRosterFile
                                : teamRosterFile
                            )
                              ? '파일 선택됨 · 업로드 전'
                              : '업로드 상태 확인 전'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </section>
        </VStack>
      </Card>
    </div>
  );
}
