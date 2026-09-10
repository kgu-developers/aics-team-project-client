import {
  Button,
  Dialog,
  FileInput,
  Heading,
  HStack,
  Selector,
  SelectorOption,
  Text,
} from '@aics/design-system';
import { useState } from 'react';

import {
  useApplyAdminEnrollmentImportMutation,
  usePreviewAdminEnrollmentImportMutation,
} from '../queries';
import * as styles from './TeamImportDialog.css';

type EnrollmentImportDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSectionChange: (sectionId: string) => void;
  sectionId: string;
  sections: { id: string; code: string; name: string }[];
};

export default function EnrollmentImportDialog({
  isOpen,
  onClose,
  onSectionChange,
  sectionId,
  sections,
}: EnrollmentImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const previewMutation = usePreviewAdminEnrollmentImportMutation();
  const applyMutation = useApplyAdminEnrollmentImportMutation();
  const preview = previewMutation.data;
  const cannotApply = !preview || preview.summary.invalid > 0;

  function reset() {
    setFile(null);
    previewMutation.reset();
    applyMutation.reset();
  }

  function close() {
    if (applyMutation.isPending) return;

    reset();
    onClose();
  }

  function closeAfterApply() {
    reset();
    onClose();
  }

  return (
    <Dialog
      aria-label='수강생 명단 엑셀 업로드'
      isOpen={isOpen}
      onOpenChange={open => {
        if (!open) close();
      }}
      purpose='info'
      width={920}
    >
      <div className={styles.content}>
        <div className={styles.body}>
          <Heading level={2}>수강생 명단 엑셀 업로드</Heading>
          <Text color='secondary'>
            파일을 미리보기로 검증한 뒤, 오류가 없을 때만 수강생 명단을
            반영합니다.
          </Text>
          <Selector
            label='분반'
            onChange={nextSectionId => {
              onSectionChange(nextSectionId);
              reset();
            }}
            options={sections.map(section => ({
              label: `${section.code} (${section.name})`,
              value: section.id,
            }))}
            renderOption={option => (
              <SelectorOption label={option.label ?? option.value} />
            )}
            value={sectionId}
            width='100%'
          />
          <FileInput
            accept='.xls,.xlsx'
            label='수강생 명단 엑셀 파일'
            mode='input'
            onChange={selected => {
              const nextFile = Array.isArray(selected) ? selected[0] : selected;

              setFile(nextFile ?? null);
              previewMutation.reset();
              applyMutation.reset();
            }}
            placeholder='Excel 파일 선택'
            value={file}
            width='100%'
          />
          {previewMutation.isError ? (
            <Text role='alert'>
              파일을 검증하지 못했습니다. 다시 시도해 주세요.
            </Text>
          ) : null}
          {preview ? (
            <>
              <div className={styles.summary}>
                <Text>전체 {preview.summary.total}건</Text>
                <Text>등록 {preview.summary.valid}건</Text>
                <Text>신규 계정 {preview.summary.newUser}건</Text>
                <Text>중복 {preview.summary.duplicate}건</Text>
                <Text>오류 {preview.summary.invalid}건</Text>
              </div>
              <div className={styles.previewTableWrap}>
                <table className={styles.previewTable}>
                  <thead>
                    <tr>
                      <th scope='col'>행</th>
                      <th scope='col'>학번</th>
                      <th scope='col'>이름</th>
                      <th scope='col'>이메일</th>
                      <th scope='col'>전공</th>
                      <th scope='col'>상태</th>
                      <th scope='col'>안내</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map(row => (
                      <tr key={`${row.rowNumber}-${row.studentNumber}`}>
                        <td>{row.rowNumber}</td>
                        <td>{row.studentNumber}</td>
                        <td>{row.name ?? '-'}</td>
                        <td>{row.email ?? '-'}</td>
                        <td>{row.major ?? '-'}</td>
                        <td>{row.status}</td>
                        <td>{row.message ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {preview.summary.invalid > 0 ? (
                <Text role='alert'>
                  오류 행을 수정한 뒤 다시 업로드해 주세요.
                </Text>
              ) : null}
            </>
          ) : null}
          {applyMutation.isError ? (
            <Text role='alert'>
              수강생 명단을 반영하지 못했습니다. 다시 시도해 주세요.
            </Text>
          ) : null}
        </div>
        <div className={styles.actions}>
          <HStack gap={2} justify='end'>
            <Button
              isDisabled={applyMutation.isPending}
              label='취소'
              onClick={close}
              variant='secondary'
            />
            {!preview ? (
              <Button
                isDisabled={!file || previewMutation.isPending}
                label={previewMutation.isPending ? '검증 중' : '미리보기'}
                onClick={() => {
                  if (!file) return;
                  previewMutation.mutate({ file, sectionId });
                }}
              />
            ) : (
              <Button
                isDisabled={cannotApply || applyMutation.isPending}
                label={applyMutation.isPending ? '반영 중' : '반영하기'}
                onClick={() => {
                  applyMutation.mutate(preview.importId, {
                    onSuccess: closeAfterApply,
                  });
                }}
              />
            )}
          </HStack>
        </div>
      </div>
    </Dialog>
  );
}
