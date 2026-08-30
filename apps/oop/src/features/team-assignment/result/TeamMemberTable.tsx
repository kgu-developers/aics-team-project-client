import type { TeamAssignmentMember } from '@aics/core';
import { Button, proportional, Table, useToast } from '@aics/design-system';

import * as styles from './TeamMemberTable.css';

type TeamMemberTableProps = {
  members: TeamAssignmentMember[];
  variant: 'assignment' | 'firstMeeting';
};

function copyWithSelection(text: string) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  textarea.setSelectionRange(0, text.length);

  try {
    if (!document.execCommand('copy')) {
      throw new Error('Copy command was rejected');
    }
  } finally {
    textarea.remove();
  }
}

export function TeamMemberTable({ members, variant }: TeamMemberTableProps) {
  const toast = useToast();
  const rows = members.map(member => ({
    department: member.department ?? '학과 미정',
    name: member.name,
    phoneNumber: member.phoneNumber ?? null,
    studentNumber: member.studentNumber,
  }));

  async function copyPhoneNumber(phoneNumber: string) {
    try {
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(phoneNumber);
        } catch {
          copyWithSelection(phoneNumber);
        }
      } else {
        copyWithSelection(phoneNumber);
      }

      toast({ body: '휴대폰 번호를 복사했습니다.' });
    } catch {
      toast({
        body: '휴대폰 번호를 복사하지 못했습니다. 다시 시도해 주세요.',
        type: 'error',
      });
    }
  }

  return (
    <div className={styles.table}>
      <Table
        columns={
          variant === 'assignment'
            ? [
                {
                  align: 'start',
                  header: '학과',
                  key: 'department',
                  width: proportional(1, { minWidth: 0 }),
                },
                {
                  align: 'start',
                  header: '학번',
                  key: 'studentNumber',
                  width: proportional(1, { minWidth: 0 }),
                },
                {
                  align: 'start',
                  header: '이름',
                  key: 'name',
                  width: proportional(1, { minWidth: 0 }),
                },
              ]
            : [
                {
                  align: 'start',
                  header: '학과',
                  key: 'department',
                  width: proportional(1, { minWidth: 0 }),
                },
                {
                  align: 'start',
                  header: '이름',
                  key: 'name',
                  width: proportional(0.55, { minWidth: 0 }),
                },
                {
                  align: 'start',
                  header: '휴대폰 번호',
                  key: 'phoneNumber',
                  renderCell: member => {
                    const phoneNumber = member.phoneNumber;
                    if (!phoneNumber) return <span>연락처 미등록</span>;

                    return (
                      <Button
                        clickAction={() => copyPhoneNumber(phoneNumber)}
                        label={`${phoneNumber} 복사`}
                        size='sm'
                        variant='ghost'
                      >
                        {phoneNumber} 복사
                      </Button>
                    );
                  },
                  width: proportional(1.45, { minWidth: 0 }),
                },
              ]
        }
        data={rows}
        density='compact'
        dividers='rows'
        textOverflow='wrap'
        verticalAlign='middle'
      />
    </div>
  );
}
