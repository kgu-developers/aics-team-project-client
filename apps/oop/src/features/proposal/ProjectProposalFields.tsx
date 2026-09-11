import type {
  ProjectProposalResponse,
  ProposalSectionType,
  UpdateProjectProposalInput,
} from '@aics/core';
import {
  Button,
  Heading,
  Text,
  TextArea,
  TextInput,
  VStack,
} from '@aics/design-system';

import * as styles from './ProjectProposalFields.css';
type Props = {
  project: ProjectProposalResponse;
  section: ProposalSectionType;
  draft: UpdateProjectProposalInput;
  disabled: boolean;
  onChange: (draft: UpdateProjectProposalInput) => void;
};
export default function ProjectProposalFields({
  project,
  section,
  draft,
  disabled,
  onChange,
}: Props) {
  const text = (
    key:
      | 'title'
      | 'description'
      | 'goal'
      | 'projectSchedule'
      | 'kickoffRule'
      | 'meetingSchedule',
    label: string,
    multiline = true,
  ) =>
    multiline ? (
      <TextArea
        label={label}
        value={draft[key] ?? ''}
        isDisabled={disabled}
        onChange={e => onChange({ ...draft, [key]: e })}
      />
    ) : (
      <TextInput
        label={label}
        value={draft[key] ?? ''}
        isDisabled={disabled}

        onChange={e => onChange({ ...draft, [key]: e })}
      />
    );
  if (section === 'TOPIC')
    return (
      <VStack gap={4}>
        {text('title', '프로젝트 제목', false)}
        {text('description', '프로젝트 설명')}
        {text('goal', '프로젝트 목표')}
      </VStack>
    );
  if (section === 'TEAM_OPERATION')
    return (
      <VStack gap={4}>
        {text('kickoffRule', '팀 규칙')}
        {text('meetingSchedule', '회의 시간·빈도·방식')}
        {text('projectSchedule', '진행 일정')}
        <Heading level={3}>역할 분담</Heading>
        {draft.memberRoles?.map((member, index) => (
          <TextInput
            key={member.studentNumber}
            label={`${project.teamOperation.members.find(m => m.studentNumber === member.studentNumber)?.name ?? member.studentNumber} 역할`}
            value={member.projectRole ?? ''}
            isDisabled={disabled}

            onChange={e =>
              onChange({
                ...draft,
                memberRoles: draft.memberRoles!.map((m, i) =>
                  i === index ? { ...m, projectRole: e } : m,
                ),
              })
            }
          />
        ))}
        <Text>팀 규칙, 회의 방식, 역할 분담은 킥오프에도 반영됩니다.</Text>
      </VStack>
    );
  if (section === 'DATA')
    return (
      <VStack gap={4}>
        {draft.dataConfiguration.map((row, index) => (
          <section
            className={styles.item}
            key={index}
            aria-label={`데이터 ${index + 1}`}
          >
            <TextInput
              label={`데이터 ${index + 1} 이름`}
              value={row.name ?? ''}
              isDisabled={disabled}
              onChange={e =>
                onChange({
                  ...draft,
                  dataConfiguration: draft.dataConfiguration.map((r, i) =>
                    i === index ? { ...r, name: e } : r,
                  ),
                })
              }
            />
            <TextArea
              label={`데이터 ${index + 1} 설명`}
              value={row.description ?? ''}
              isDisabled={disabled}
              onChange={e =>
                onChange({
                  ...draft,
                  dataConfiguration: draft.dataConfiguration.map((r, i) =>
                    i === index ? { ...r, description: e } : r,
                  ),
                })
              }
            />
            <TextInput
              label={`데이터 ${index + 1} 예상 개수`}
              value={row.expectedCount ?? ''}
              isDisabled={disabled}
              onChange={e =>
                onChange({
                  ...draft,
                  dataConfiguration: draft.dataConfiguration.map((r, i) =>
                    i === index ? { ...r, expectedCount: e } : r,
                  ),
                })
              }
            />
            <Button
              label={`데이터 ${index + 1} 삭제`}
              isDisabled={disabled}
              variant='secondary'
              onClick={() =>
                onChange({
                  ...draft,
                  dataConfiguration: draft.dataConfiguration.filter(
                    (_, i) => i !== index,
                  ),
                })
              }
            />
          </section>
        ))}
        {!draft.dataConfiguration.length && (
          <Text>등록한 데이터가 없습니다.</Text>
        )}
        <Button
          label='데이터 추가'
          variant='secondary'
          isDisabled={disabled}
          onClick={() =>
            onChange({
              ...draft,
              dataConfiguration: [
                ...draft.dataConfiguration,
                { name: '', description: '', expectedCount: '' },
              ],
            })
          }
        />
      </VStack>
    );
  return (
    <VStack gap={4}>
      {draft.screenConfiguration.map((row, index) => (
        <section
          className={styles.item}
          key={index}
          aria-label={`화면 ${index + 1}`}
        >
          <TextInput
            label={`화면 ${index + 1} 이름`}
            value={row.title ?? ''}
            isDisabled={disabled}
            onChange={e =>
              onChange({
                ...draft,
                screenConfiguration: draft.screenConfiguration.map((r, i) =>
                  i === index ? { ...r, title: e } : r,
                ),
              })
            }
          />
          <TextArea
            label={`화면 ${index + 1} 설명`}
            value={row.description ?? ''}
            isDisabled={disabled}
            onChange={e =>
              onChange({
                ...draft,
                screenConfiguration: draft.screenConfiguration.map((r, i) =>
                  i === index ? { ...r, description: e } : r,
                ),
              })
            }
          />
          {project.screenConfiguration.find(
            s => s.imageFileId != null && s.imageFileId === row.imageFileId,
          )?.imageUrl && (
            <img
              className={styles.image}
              alt={row.title || `화면 ${index + 1}`}
              src={
                project.screenConfiguration.find(
                  s => s.imageFileId === row.imageFileId,
                )!.imageUrl!
              }
            />
          )}
          <Button
            label={`화면 ${index + 1} 삭제`}
            isDisabled={disabled}
            variant='secondary'
            onClick={() =>
              onChange({
                ...draft,
                screenConfiguration: draft.screenConfiguration.filter(
                  (_, i) => i !== index,
                ),
              })
            }
          />
        </section>
      ))}
      {!draft.screenConfiguration.length && (
        <Text>등록한 화면이 없습니다.</Text>
      )}
      <Button
        label='화면 추가'
        variant='secondary'
        isDisabled={disabled}
        onClick={() =>
          onChange({
            ...draft,
            screenConfiguration: [
              ...draft.screenConfiguration,
              { title: '', description: '' },
            ],
          })
        }
      />
    </VStack>
  );
}
