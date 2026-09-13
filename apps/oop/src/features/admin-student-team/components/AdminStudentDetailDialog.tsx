import { Button, Dialog, Heading, HStack, Text } from '@aics/design-system';
import type { ReactNode } from 'react';

import { useAdminUserQuery } from '../queries';
import * as styles from './AdminStudentDetailDialog.css';

type AdminStudentDetailDialogProps = {
  studentNumber: string | null;
  major?: string | null;
  details?: ReactNode;
  onClose: () => void;
};

export default function AdminStudentDetailDialog({
  studentNumber,
  major,
  details,
  onClose,
}: AdminStudentDetailDialogProps) {
  const userQuery = useAdminUserQuery(studentNumber);
  const user = userQuery.data;

  return (
    <Dialog
      aria-label={user ? `${user.name} 수강생 정보` : '수강생 정보'}
      isOpen={studentNumber !== null}
      onOpenChange={open => {
        if (!open) onClose();
      }}
      purpose='info'
      width={480}
    >
      <div className={styles.content}>
        <Heading level={2}>{user?.name ?? '수강생'} 정보</Heading>
        {userQuery.isPending ? (
          <Text>수강생 정보를 불러오는 중입니다.</Text>
        ) : null}
        {userQuery.isError ? (
          <Text role='alert'>수강생 정보를 불러오지 못했습니다.</Text>
        ) : null}
        {user ? (
          <dl className={styles.detailList}>
            <div>
              <dt>이름</dt>
              <dd>{user.name}</dd>
            </div>
            <div>
              <dt>학번</dt>
              <dd>{user.studentNumber}</dd>
            </div>
            <div>
              <dt>이메일</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt>전공</dt>
              <dd>{major ?? '전공 정보 없음'}</dd>
            </div>
            <div>
              <dt>전화번호</dt>
              <dd>{user.phone}</dd>
            </div>
          </dl>
        ) : null}
        {user && details ? details : null}
        <HStack gap={2} justify='end'>
          <Button label='닫기' onClick={onClose} variant='secondary' />
        </HStack>
      </div>
    </Dialog>
  );
}
