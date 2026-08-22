import {
  Button,
  Card,
  Dialog,
  FileInput,
  Heading,
  Text,
  TextArea,
  TextInput,
  VStack,
} from '@aics/design-system';
import { useState } from 'react';

import {
  useAdminProfileQuery,
  useUpdateAdminProfileMutation,
} from '~/features/admin-profile/queries';
import { useAuthStore } from '~/features/auth/authStore';

import * as styles from './AdminProfilePage.css';

type UploadFileKind = 'studentRoster' | 'teamRoster';
type Section = { id: string; code: string; name: string };

const uploadCopy: Record<
  UploadFileKind,
  { description: string; label: string; title: string }
> = {
  studentRoster: {
    description:
      '학번, 이름, 소속(전공), 학년, 학적 구분, 이메일 컬럼 포함 Excel (.xls/.xlsx)',
    label: '학생 명단 파일 선택',
    title: '학생 명단',
  },
  teamRoster: {
    description: '팀명, 학번 컬럼 포함 Excel (.xls/.xlsx)',
    label: '팀 구성 명단 파일 선택',
    title: '팀 구성 명단',
  },
};

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

function UploadDialog({
  file,
  fileError,
  isOpen,
  kind,
  onClose,
  onFileChange,
  onSectionChange,
  sections,
  sectionId,
}: {
  file: File | null;
  fileError: string | null;
  isOpen: boolean;
  kind: UploadFileKind | null;
  onClose: () => void;
  onFileChange: (file: File | null) => void;
  onSectionChange: (sectionId: string) => void;
  sections: Section[];
  sectionId: string;
}) {
  if (!kind) return null;
  const copy = uploadCopy[kind];

  return (
    <Dialog
      aria-label={`${copy.title} 업로드`}
      isOpen={isOpen}
      onOpenChange={nextIsOpen => {
        if (!nextIsOpen) onClose();
      }}
      purpose='info'
      width={520}
    >
      <VStack gap={3}>
        <Heading level={2}>{copy.title} 업로드</Heading>
        <Text color='secondary' type='supporting'>
          업로드할 분반을 선택한 뒤 Excel 파일을 선택해 주세요. 아직 서버에
          업로드되지는 않습니다.
        </Text>
        <label>
          <Text>분반</Text>
          <select
            aria-label='업로드 분반'
            className={styles.sectionSelect}
            onChange={event => onSectionChange(event.target.value)}
            value={sectionId}
          >
            {sections.map(section => (
              <option key={section.id} value={section.id}>
                {section.code} ({section.name})
              </option>
            ))}
          </select>
        </label>
        <FileInput
          accept='.xls,.xlsx'
          label={copy.label}
          mode='input'
          onChange={selected => {
            const nextFile = Array.isArray(selected) ? selected[0] : selected;
            onFileChange(nextFile ?? null);
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
        {fileError ? <Text role='alert'>{fileError}</Text> : null}
        <div className={styles.actions}>
          <Button label='닫기' onClick={onClose} variant='secondary' />
        </div>
      </VStack>
    </Dialog>
  );
}

export default function AdminProfilePage() {
  const currentUser = useAuthStore(state => state.currentUser);
  const [message, setMessage] = useState('');
  const [isEditingIntroduction, setIsEditingIntroduction] = useState(false);
  const [uploadKind, setUploadKind] = useState<UploadFileKind | null>(null);
  const [uploadSectionId, setUploadSectionId] = useState('');
  const [uploadFiles, setUploadFiles] = useState<
    Record<UploadFileKind, Record<string, File | null>>
  >({
    studentRoster: {},
    teamRoster: {},
  });
  const [uploadFileErrors, setUploadFileErrors] = useState<
    Record<UploadFileKind, Record<string, string | null>>
  >({
    studentRoster: {},
    teamRoster: {},
  });
  const sections = currentUser?.sections ?? [];
  const profileQuery = useAdminProfileQuery();
  const updateProfileMutation = useUpdateAdminProfileMutation();
  const savedIntroduction = profileQuery.data?.introduction ?? '';
  const hasSavedIntroduction = savedIntroduction.trim().length > 0;
  const showIntroductionEditor = isEditingIntroduction || !hasSavedIntroduction;
  const uploadSections = sections.map(section => ({
    code: section.code,
    id: section.id,
    name: section.name,
  }));
  const selectedUploadFile =
    uploadKind && uploadSectionId
      ? (uploadFiles[uploadKind][uploadSectionId] ?? null)
      : null;

  function openUploadDialog(kind: UploadFileKind) {
    setUploadKind(kind);
    setUploadSectionId(uploadSections[0]?.id ?? '');
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateProfileMutation.mutate(
      { introduction: message },
      {
        onSuccess: profile => {
          setMessage(profile.introduction);
          setIsEditingIntroduction(false);
        },
      },
    );
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

          <div className={styles.profileForm}>
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
            {showIntroductionEditor ? (
              <form className={styles.introductionForm} onSubmit={handleSubmit}>
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
              </form>
            ) : (
              <section className={styles.introductionForm}>
                <Text className={styles.fieldLabel}>간단한 메시지</Text>
                <div
                  aria-label='간단한 메시지'
                  className={styles.introductionPreview}
                >
                  {savedIntroduction}
                </div>
                <Text color='secondary' type='supporting'>
                  학생들에게 노출되는 소개 메시지입니다.
                </Text>
                <div className={styles.actions}>
                  <Button
                    label='수정하기'
                    onClick={() => {
                      updateProfileMutation.reset();
                      setMessage(savedIntroduction);
                      setIsEditingIntroduction(true);
                    }}
                    type='button'
                    variant='secondary'
                  />
                </div>
              </section>
            )}
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
          </div>
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
              kind='studentRoster'
              onOpen={() => openUploadDialog('studentRoster')}
            />
            <FileSelectionCard
              kind='teamRoster'
              onOpen={() => openUploadDialog('teamRoster')}
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
                            {uploadFiles[kind][section.id]
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

      <UploadDialog
        file={selectedUploadFile}
        fileError={
          uploadKind && uploadSectionId
            ? (uploadFileErrors[uploadKind][uploadSectionId] ?? null)
            : null
        }
        isOpen={uploadKind !== null && uploadSectionId !== ''}
        kind={uploadKind}
        onClose={() => setUploadKind(null)}
        onFileChange={file => {
          if (!uploadKind || !uploadSectionId) return;
          const isExcelFile = file ? /\.(xls|xlsx)$/i.test(file.name) : true;
          setUploadFiles(current => ({
            ...current,
            [uploadKind]: {
              ...current[uploadKind],
              [uploadSectionId]: isExcelFile ? file : null,
            },
          }));
          setUploadFileErrors(current => ({
            ...current,
            [uploadKind]: {
              ...current[uploadKind],
              [uploadSectionId]: isExcelFile
                ? null
                : 'Excel(.xls 또는 .xlsx) 파일만 선택할 수 있습니다.',
            },
          }));
        }}
        onSectionChange={setUploadSectionId}
        sections={uploadSections}
        sectionId={uploadSectionId}
      />
    </div>
  );
}
