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
import { useMemo, useState, type FormEvent } from 'react';

import { ROUTES } from '~/app/constants/routes';

import {
  createAdminMilestoneSectionScheduleDraft,
  createAdminMilestoneCreateInput,
  findMilestoneTemplate,
  isMilestoneTemplateId,
  isSupportedMilestoneCreationTemplate,
  milestoneTemplates,
  syncAdminMilestoneSectionScheduleDrafts,
  type AdminMilestoneSectionScheduleDraft,
  type MilestoneTemplateId,
} from '~/features/admin-milestone-review/model';
import {
  useSubmitAdminSectionMilestonesMutation,
  type SubmitAdminSectionMilestonesResult,
} from '~/features/admin-milestone-review/queries';
import { useAuthStore } from '~/features/auth/authStore';

import * as styles from './AdminMilestoneSetupPage.css';

function getTemplate(templateId: MilestoneTemplateId) {
  const fallbackTemplate = milestoneTemplates[0];

  if (!fallbackTemplate) {
    throw new Error('마일스톤 기본 양식이 없습니다.');
  }

  return findMilestoneTemplate(templateId) ?? fallbackTemplate;
}

export default function AdminMilestoneSetupPage() {
  const currentUser = useAuthStore(state => state.currentUser);
  const search = useSearch({ from: '/admin/milestones/new' }) as {
    milestoneId?: string;
    sectionId?: string;
  };
  const sections = currentUser?.sections ?? [];
  const initialTemplateId =
    isMilestoneTemplateId(search.milestoneId) &&
    isSupportedMilestoneCreationTemplate(search.milestoneId)
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
  const [weekNumber, setWeekNumber] = useState('1');
  const [formError, setFormError] = useState<string>();
  const [submissionResults, setSubmissionResults] =
    useState<readonly SubmitAdminSectionMilestonesResult[]>();
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
  const submitMilestonesMutation = useSubmitAdminSectionMilestonesMutation();
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(undefined);
    setSubmissionResults(undefined);

    const parsedWeekNumber = Number(weekNumber);
    if (!title.trim()) {
      setFormError('마일스톤 제목을 입력해주세요.');
      return;
    }
    if (!Number.isInteger(parsedWeekNumber) || parsedWeekNumber < 1) {
      setFormError('진행 주차는 1 이상의 정수로 입력해주세요.');
      return;
    }
    if (selectedSections.length === 0) {
      setFormError('대상 분반을 하나 이상 선택해주세요.');
      return;
    }

    try {
      const results = await submitMilestonesMutation.mutateAsync({
        sections: selectedSections.map(section => ({
          input: createAdminMilestoneCreateInput({
            description,
            schedule:
              sectionSchedules[section.id] ??
              createAdminMilestoneSectionScheduleDraft(),
            templateId,
            title,
            weekNumber: parsedWeekNumber,
          }),
          publish: sectionSchedules[section.id]?.isPublished ?? false,
          sectionId: section.id,
        })),
      });
      setSubmissionResults(results);
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : '마일스톤을 저장하지 못했습니다.',
      );
    }
  };

  const getSectionLabel = (sectionId: string) => {
    const section = sections.find(candidate => candidate.id === sectionId);
    return section ? `${section.code} · ${section.name}` : sectionId;
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
        <form className={styles.form} onSubmit={handleSubmit}>
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
              선택한 분반마다 공개 일정과 공개 상태를 따로 설정합니다. 저장하면
              선택한 분반별로 독립된 요청이 전송됩니다.
            </Text>
            <Selector
              aria-label='마일스톤 기본 양식'
              label='마일스톤 기본 양식'
              onChange={handleTemplateChange}
              options={milestoneTemplates
                .filter(templateOption =>
                  isSupportedMilestoneCreationTemplate(templateOption.id),
                )
                .map(templateOption => ({
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
            <label className={styles.weekNumberField}>
              <Text weight='medium'>진행 주차</Text>
              <input
                aria-label='진행 주차'
                className={styles.numberInput}
                min='1'
                onChange={event => setWeekNumber(event.target.value)}
                required
                type='number'
                value={weekNumber}
              />
            </label>
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
                            <label>
                              <Text type='supporting'>{`${section.code} 공개 시작 시간`}</Text>
                              <input
                                aria-label={`${section.code} 공개 시작 시간`}
                                className={styles.timeInput}
                                onChange={event =>
                                  updateSectionSchedule(
                                    section.id,
                                    current => ({
                                      ...current,
                                      opensAt: {
                                        ...current.opensAt,
                                        time: event.target.value,
                                      },
                                    }),
                                  )
                                }
                                type='time'
                                value={schedule.opensAt.time}
                              />
                            </label>
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
                            <label>
                              <Text type='supporting'>{`${section.code} 제출 마감 시간`}</Text>
                              <input
                                aria-label={`${section.code} 제출 마감 시간`}
                                className={styles.timeInput}
                                onChange={event =>
                                  updateSectionSchedule(
                                    section.id,
                                    current => ({
                                      ...current,
                                      dueAt: {
                                        ...current.dueAt,
                                        time: event.target.value,
                                      },
                                    }),
                                  )
                                }
                                type='time'
                                value={schedule.dueAt.time}
                              />
                            </label>
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
                      {schedule.allowLateSubmission ? (
                        <div className={styles.scheduleField}>
                          <Text weight='medium'>지각 제출 마감 일시</Text>
                          <div className={styles.scheduleInputs}>
                            <DateInput
                              hasClear
                              label={`${section.code} 지각 제출 마감일`}
                              onChange={date =>
                                updateSectionSchedule(section.id, current => ({
                                  ...current,
                                  lateSubmissionUntil: {
                                    ...current.lateSubmissionUntil,
                                    date: date ?? '',
                                  },
                                }))
                              }
                              placeholder='날짜 선택'
                              value={
                                schedule.lateSubmissionUntil.date
                                  ? (schedule.lateSubmissionUntil
                                      .date as `${number}${number}${number}${number}-${number}${number}-${number}${number}`)
                                  : undefined
                              }
                              width='100%'
                            />
                            <label>
                              <Text type='supporting'>{`${section.code} 지각 제출 마감 시간`}</Text>
                              <input
                                aria-label={`${section.code} 지각 제출 마감 시간`}
                                className={styles.timeInput}
                                onChange={event =>
                                  updateSectionSchedule(
                                    section.id,
                                    current => ({
                                      ...current,
                                      lateSubmissionUntil: {
                                        ...current.lateSubmissionUntil,
                                        time: event.target.value,
                                      },
                                    }),
                                  )
                                }
                                type='time'
                                value={schedule.lateSubmissionUntil.time}
                              />
                            </label>
                          </div>
                        </div>
                      ) : null}
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
                    <span className={styles.previewItemNumber}>
                      {index + 1}
                    </span>
                    <span>{field}</span>
                  </li>
                ))}
              </ul>
              <Text
                className={styles.previewNote}
                color='secondary'
                type='supporting'
              >
                기본 양식의 블록 구성은 현재 학생 화면과 동일한 고정 구조입니다.
                블록 추가·삭제·순서 변경은 별도 양식 API가 준비되면 지원합니다.
              </Text>
            </div>
          </section>

          <div className={styles.action}>
            <Text className={styles.actionNote} type='supporting'>
              공개를 선택하면 생성 후 공개 상태 변경 요청을 한 번 더 전송합니다.
            </Text>
            {formError ? (
              <Text className={styles.formError} role='alert'>
                {formError}
              </Text>
            ) : null}
            {submissionResults ? (
              <ul aria-live='polite' className={styles.resultList}>
                {submissionResults.map(result => (
                  <li key={result.sectionId}>
                    {getSectionLabel(result.sectionId)}:{' '}
                    {result.status === 'published'
                      ? '생성하고 공개했습니다.'
                      : result.status === 'created'
                        ? '미공개 마일스톤으로 생성했습니다.'
                        : result.status === 'publish-failed'
                          ? '생성했지만 공개 상태 변경에 실패했습니다. 목록에서 다시 공개할 수 있습니다.'
                          : '생성에 실패했습니다.'}
                  </li>
                ))}
              </ul>
            ) : null}
            <Link to={ROUTES.ADMIN_MILESTONES}>취소</Link>
            <Button
              isDisabled={submitMilestonesMutation.isPending}
              isLoading={submitMilestonesMutation.isPending}
              label='저장'
              type='submit'
              variant='primary'
            />
          </div>
        </form>
      </Card>
    </div>
  );
}
