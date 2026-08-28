import {
  Button,
  Card,
  CheckboxList,
  CheckboxListItem,
  DateInput,
  Heading,
  MultiSelector,
  Selector,
  SelectorOption,
  Text,
  TextArea,
  TextInput,
} from '@aics/design-system';
import { Link, useSearch } from '@tanstack/react-router';
import { useMemo, useState } from 'react';

import { ROUTES } from '~/app/constants/routes';

import {
  createAdminMilestoneSectionScheduleDraft,
  syncAdminMilestoneSectionScheduleDrafts,
  type AdminMilestoneSectionScheduleDraft,
} from '~/features/admin-milestone-review/model';
import { useAuthStore } from '~/features/auth/authStore';

import * as styles from './AdminMilestoneSetupPage.css';

type MilestoneTemplateId =
  | 'proposal'
  | 'midterm'
  | 'presentation-submit'
  | 'presentation-evaluate'
  | 'final-report'
  | 'peer-review';

type MilestoneTemplate = {
  description: string;
  fields: string[];
  id: MilestoneTemplateId;
  label: string;
  title: string;
};

const milestoneTemplates: readonly MilestoneTemplate[] = [
  {
    id: 'proposal',
    label: '제안서',
    title: '제안서',
    description: '프로젝트의 목표와 구성 방식을 정리하는 기본 양식입니다.',
    fields: ['팀 정보', '주제', '데이터 구성', '화면 구성', '팀 운영 방식'],
  },
  {
    id: 'midterm',
    label: '중간 점검',
    title: '중간 점검',
    description: '프로젝트 진행 상황과 설계 내용을 점검하는 기본 양식입니다.',
    fields: [
      '주제',
      '화면 GUI 설계',
      '엔진부 설계',
      '팀프로젝트 진행 계획',
      '중간 점검 질문',
    ],
  },
  {
    id: 'presentation-submit',
    label: '발표 자료 제출',
    title: '발표 자료 제출',
    description:
      '발표에 사용할 프로젝트 설명과 자료를 제출하는 기본 양식입니다.',
    fields: [
      '프로젝트 개요',
      '프레젠테이션 자료',
      '주요 기능',
      '주요 화면',
      '시연 영상',
    ],
  },
  {
    id: 'presentation-evaluate',
    label: '발표 평가',
    title: '발표 평가',
    description: '학생이 다른 팀의 발표를 평가하는 기본 평가 항목입니다.',
    fields: ['프로젝트 완성도', '기능 구성과 구현', '발표 전달력'],
  },
  {
    id: 'final-report',
    label: '최종 보고서',
    title: '최종 보고서',
    description:
      '최종 보고서 PDF와 최종 소스코드 ZIP을 제출하는 기본 양식입니다.',
    fields: ['최종보고서 PDF', '최종 소스코드 ZIP'],
  },
  {
    id: 'peer-review',
    label: '상호 평가',
    title: '상호 평가',
    description: '프로젝트 평가와 팀원 기여도를 제출하는 기본 양식입니다.',
    fields: ['프로젝트 평가', '팀원 기여도 평가'],
  },
];

function getTemplate(templateId: MilestoneTemplateId) {
  const fallbackTemplate = milestoneTemplates[0];

  if (!fallbackTemplate) {
    throw new Error('마일스톤 기본 양식이 없습니다.');
  }

  return (
    milestoneTemplates.find(template => template.id === templateId) ??
    fallbackTemplate
  );
}

function isMilestoneTemplateId(
  value: string | undefined,
): value is MilestoneTemplateId {
  return milestoneTemplates.some(template => template.id === value);
}

export default function AdminMilestoneSetupPage() {
  const currentUser = useAuthStore(state => state.currentUser);
  const search = useSearch({ from: '/admin/milestones/new' }) as {
    milestoneId?: string;
    sectionId?: string;
  };
  const sections = currentUser?.sections ?? [];
  const initialTemplateId = isMilestoneTemplateId(search.milestoneId)
    ? search.milestoneId
    : 'proposal';
  const initialTemplate = getTemplate(initialTemplateId);
  const initialSectionId = sections.some(
    section => section.id === search.sectionId,
  )
    ? search.sectionId!
    : (sections[0]?.id ?? '');
  const [templateId, setTemplateId] =
    useState<MilestoneTemplateId>(initialTemplateId);
  const [title, setTitle] = useState(initialTemplate.title);
  const [description, setDescription] = useState(initialTemplate.description);
  const [sectionIds, setSectionIds] = useState<string[]>(
    initialSectionId ? [initialSectionId] : [],
  );
  const [sectionSchedules, setSectionSchedules] = useState<
    Record<string, AdminMilestoneSectionScheduleDraft>
  >(() =>
    initialSectionId
      ? { [initialSectionId]: createAdminMilestoneSectionScheduleDraft() }
      : {},
  );

  const template = useMemo(() => getTemplate(templateId), [templateId]);
  const sectionOptions = sections.map(section => ({
    label: `${section.code} · ${section.name}`,
    value: section.id,
  }));

  const selectedSections = sections.filter(section =>
    sectionIds.includes(section.id),
  );

  const handleSectionChange = (nextSectionIds: string[]) => {
    const accessibleSectionIds = nextSectionIds.filter(sectionId =>
      sections.some(section => section.id === sectionId),
    );

    setSectionIds(accessibleSectionIds);
    setSectionSchedules(currentDrafts =>
      syncAdminMilestoneSectionScheduleDrafts(
        accessibleSectionIds,
        currentDrafts,
      ),
    );
  };

  const updateSectionSchedule = (
    sectionId: string,
    update: (
      current: AdminMilestoneSectionScheduleDraft,
    ) => AdminMilestoneSectionScheduleDraft,
  ) => {
    setSectionSchedules(currentDrafts => ({
      ...currentDrafts,
      [sectionId]: update(
        currentDrafts[sectionId] ?? createAdminMilestoneSectionScheduleDraft(),
      ),
    }));
  };

  const handleTemplateChange = (nextTemplateId: string) => {
    const nextTemplate = getTemplate(nextTemplateId as MilestoneTemplateId);

    setTemplateId(nextTemplate.id);
    setTitle(nextTemplate.title);
    setDescription(nextTemplate.description);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <Heading level={1}>마일스톤 설정</Heading>
          <Text color='secondary' type='supporting'>
            기본 양식을 선택하고 담당 분반의 공개 일정과 마감 일시를 준비합니다.
          </Text>
        </div>
        <Link className={styles.backLink} to={ROUTES.ADMIN_MILESTONES}>
          ← 마일스톤 목록으로
        </Link>
      </header>

      <Card padding={4}>
        <form
          className={styles.form}
          onSubmit={event => event.preventDefault()}
        >
          <section className={styles.section}>
            <Heading className={styles.sectionTitle} level={2}>
              기본 설정
            </Heading>
            <MultiSelector
              hasClear
              hasSelectAll
              label='대상 분반'
              onChange={handleSectionChange}
              options={sectionOptions}
              placeholder='분반을 선택해주세요.'
              selectAllLabel='전체 선택'
              triggerDisplay='labels'
              value={sectionIds}
              width='100%'
            />
            <Text color='secondary' type='supporting'>
              선택한 분반마다 공개 일정과 공개 상태를 따로 설정합니다. 여러 분반
              저장의 API 요청 형식은 계약 확정 후 연결합니다.
            </Text>
            <Selector
              aria-label='마일스톤 기본 양식'
              label='마일스톤 기본 양식'
              onChange={handleTemplateChange}
              options={milestoneTemplates.map(templateOption => ({
                label: templateOption.label,
                value: templateOption.id,
              }))}
              renderOption={option => (
                <SelectorOption label={option.label ?? option.value} />
              )}
              value={templateId}
              width='100%'
            />
            <TextInput label='제목' onChange={setTitle} value={title} />
            <TextArea
              label='설명'
              onChange={setDescription}
              placeholder='학생에게 표시할 마일스톤 설명을 입력해주세요.'
              value={description}
            />
          </section>

          <section className={styles.section}>
            <Heading className={styles.sectionTitle} level={2}>
              공개 및 제출 일정
            </Heading>
            {selectedSections.length === 0 ? (
              <Text color='secondary' type='supporting'>
                일정을 설정할 분반을 하나 이상 선택해주세요.
              </Text>
            ) : (
              <div className={styles.sectionScheduleList}>
                {selectedSections.map(section => {
                  const schedule =
                    sectionSchedules[section.id] ??
                    createAdminMilestoneSectionScheduleDraft();

                  return (
                    <article
                      className={styles.sectionSchedule}
                      key={section.id}
                    >
                      <Heading
                        level={3}
                      >{`${section.code} · ${section.name}`}</Heading>
                      <div className={styles.scheduleGrid}>
                        <div className={styles.scheduleField}>
                          <Text weight='medium'>공개 시작 일시</Text>
                          <div className={styles.scheduleInputs}>
                            <DateInput
                              hasClear
                              label={`${section.code} 공개 시작일`}
                              onChange={date =>
                                updateSectionSchedule(section.id, current => ({
                                  ...current,
                                  opensAt: {
                                    ...current.opensAt,
                                    date: date ?? '',
                                  },
                                }))
                              }
                              placeholder='날짜 선택'
                              value={
                                schedule.opensAt.date
                                  ? (schedule.opensAt
                                      .date as `${number}${number}${number}${number}-${number}${number}-${number}${number}`)
                                  : undefined
                              }
                              width='100%'
                            />
                            <TextInput
                              label={`${section.code} 공개 시작 시간`}
                              onChange={time =>
                                updateSectionSchedule(section.id, current => ({
                                  ...current,
                                  opensAt: { ...current.opensAt, time },
                                }))
                              }
                              placeholder='HH:mm'
                              value={schedule.opensAt.time}
                              width='100%'
                            />
                          </div>
                        </div>
                        <div className={styles.scheduleField}>
                          <Text weight='medium'>제출 마감 일시</Text>
                          <div className={styles.scheduleInputs}>
                            <DateInput
                              hasClear
                              label={`${section.code} 제출 마감일`}
                              onChange={date =>
                                updateSectionSchedule(section.id, current => ({
                                  ...current,
                                  dueAt: { ...current.dueAt, date: date ?? '' },
                                }))
                              }
                              placeholder='날짜 선택'
                              value={
                                schedule.dueAt.date
                                  ? (schedule.dueAt
                                      .date as `${number}${number}${number}${number}-${number}${number}-${number}${number}`)
                                  : undefined
                              }
                              width='100%'
                            />
                            <TextInput
                              label={`${section.code} 제출 마감 시간`}
                              onChange={time =>
                                updateSectionSchedule(section.id, current => ({
                                  ...current,
                                  dueAt: { ...current.dueAt, time },
                                }))
                              }
                              placeholder='HH:mm'
                              value={schedule.dueAt.time}
                              width='100%'
                            />
                          </div>
                        </div>
                      </div>
                      <Selector
                        aria-label={`${section.code} 공개 상태`}
                        label='공개 상태'
                        onChange={nextStatus =>
                          updateSectionSchedule(section.id, current => ({
                            ...current,
                            isPublished: nextStatus === 'published',
                          }))
                        }
                        options={[
                          { label: '미공개', value: 'unpublished' },
                          { label: '공개', value: 'published' },
                        ]}
                        renderOption={option => (
                          <SelectorOption
                            label={option.label ?? option.value}
                          />
                        )}
                        value={
                          schedule.isPublished ? 'published' : 'unpublished'
                        }
                        width={180}
                      />
                      <CheckboxList
                        description='마감 일시와 지각 제출 정책은 선택한 분반별로 따로 설정됩니다.'
                        label='제출 정책'
                        onChange={values =>
                          updateSectionSchedule(section.id, current => ({
                            ...current,
                            allowLateSubmission: values.includes(
                              'allow-late-submission',
                            ),
                            allowSubmissionEditBeforeDueAt: values.includes(
                              'allow-submission-edit-before-due-at',
                            ),
                          }))
                        }
                        value={[
                          ...(schedule.allowSubmissionEditBeforeDueAt
                            ? ['allow-submission-edit-before-due-at']
                            : []),
                          ...(schedule.allowLateSubmission
                            ? ['allow-late-submission']
                            : []),
                        ]}
                      >
                        <CheckboxListItem
                          description='제출 마감 일시 전까지 이미 제출한 내용을 수정할 수 있습니다.'
                          label='제출 마감 전 수정 허용'
                          value='allow-submission-edit-before-due-at'
                        />
                        <CheckboxListItem
                          description='제출 마감 이후에도 지각 상태로 제출할 수 있습니다.'
                          label='지각 제출 허용'
                          value='allow-late-submission'
                        />
                      </CheckboxList>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section className={styles.section}>
            <Heading className={styles.sectionTitle} level={2}>
              기본 양식 미리보기
            </Heading>
            <div className={styles.preview}>
              <Text className={styles.previewEyebrow} type='supporting'>
                학생 화면 기본 양식 미리보기
              </Text>
              <Heading className={styles.previewTitle} level={3}>
                {title.trim() || '마일스톤 제목을 입력해주세요.'}
              </Heading>
              <Text className={styles.previewTemplate} weight='medium'>
                기본 양식: {template.label}
              </Text>
              <Text className={styles.previewDescription} color='secondary'>
                {description.trim() || '마일스톤 설명을 입력해주세요.'}
              </Text>
              <Text className={styles.previewBlocksTitle} weight='medium'>
                학생에게 표시되는 고정 블록
              </Text>
              <ul className={styles.previewList}>
                {template.fields.map((field, index) => (
                  <li className={styles.previewItem} key={field}>
                    <span className={styles.previewItemNumber}>{index + 1}</span>
                    <span>{field}</span>
                  </li>
                ))}
              </ul>
              <Text className={styles.previewNote} color='secondary' type='supporting'>
                기본 양식의 블록 구성은 현재 학생 화면과 동일한 고정 구조입니다.
                블록 추가·삭제·순서 변경과 실제 저장은 양식 API 계약 확정 후
                지원합니다.
              </Text>
            </div>
          </section>

          <div className={styles.action}>
            <Text className={styles.actionNote} type='supporting'>
              실제 저장은 관리자 마일스톤 API가 병합되고 요청·응답 계약이 확정된
              뒤 연결합니다.
            </Text>
            <Link to={ROUTES.ADMIN_MILESTONES}>취소</Link>
            <Button isDisabled label='저장' type='submit' variant='primary' />
          </div>
        </form>
      </Card>
    </div>
  );
}
