import {
  fetchAdminSectionMilestone,
  type AdminPeerEvaluationFormCreateInput,
} from '@aics/api-client';
import {
  Button,
  Card,
  CheckboxList,
  CheckboxListItem,
  DateInput,
  EmptyState,
  Heading,
  MultiSelector,
  Selector,
  SelectorOption,
  Text,
  TextArea,
  TextInput,
  TimeInput,
  type TimeInputProps,
} from '@aics/design-system';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { isAxiosError } from 'axios';
import { useEffect, useRef, useState, type FormEvent } from 'react';

import { ROUTES } from '~/app/constants/routes';

import { useCreateAdminPeerEvaluationFormMutation } from '~/features/admin-evaluation/queries';
import AdminRequiredArtifactDraftEditor from '~/features/admin-milestone-review/components/AdminRequiredArtifactDraftEditor';
import AdminRequiredArtifactsManager from '~/features/admin-milestone-review/components/AdminRequiredArtifactsManager';
import {
  createAdminMilestoneSectionScheduleDraft,
  createAdminMilestoneSectionScheduleDraftFromDto,
  createAdminMilestoneCreateInput,
  createAdminRequiredArtifactDrafts,
  createAdminMilestoneUpdateInput,
  findMilestoneTemplate,
  formatAdminMilestoneRequestError,
  getAdminMilestoneTypeLabel,
  isMilestoneTemplateId,
  isSupportedMilestoneCreationTemplate,
  milestoneTemplates,
  syncAdminMilestoneSectionScheduleDrafts,
  toAdminMilestoneDateTime,
  toAdminMilestoneRequestError,
  type AdminMilestoneSectionScheduleDraft,
  type AdminRequiredArtifactDraft,
  type MilestoneTemplateId,
} from '~/features/admin-milestone-review/model';
import {
  adminSectionMilestoneKeys,
  useSubmitAdminSectionMilestonesMutation,
  useSubmitAdminRequiredArtifactsMutation,
  useAdminSectionMilestoneQuery,
  useAdminSectionMilestonesQuery,
  useUpdateAdminSectionMilestoneMutation,
  useUpdateAdminSectionMilestoneEvaluationWindowMutation,
  type SubmitAdminSectionMilestonesInput,
  type SubmitAdminSectionMilestonesResult,
} from '~/features/admin-milestone-review/queries';
import { useAuthStore } from '~/features/auth/authStore';
import { toPresentationEvaluationServerDateTime } from '~/features/evaluation/presentationEvaluationDateTime';

import * as styles from './AdminMilestoneSetupPage.css';

function getTemplate(templateId: MilestoneTemplateId) {
  const fallbackTemplate = milestoneTemplates[0];

  if (!fallbackTemplate) {
    throw new Error('마일스톤 기본 양식이 없습니다.');
  }

  return findMilestoneTemplate(templateId) ?? fallbackTemplate;
}

const quickTimeOptions = ['09:00', '12:00', '18:00', '23:59'] as const;

type ScheduleTimeInputProps = {
  label: string;
  onChange: (value: string) => void;
  value: string;
};

function ScheduleTimeInput({ label, onChange, value }: ScheduleTimeInputProps) {
  return (
    <div className={styles.timeField}>
      <TimeInput
        hasClear
        hourFormat='24h'
        increment={5}
        label={label}
        onChange={nextValue => onChange(nextValue ?? '')}
        value={value ? (value as TimeInputProps['value']) : undefined}
        width='100%'
      />
      <div className={styles.quickTimeActions}>
        <Text color='secondary' type='supporting'>
          빠른 선택
        </Text>
        <div className={styles.quickTimeButtons}>
          {quickTimeOptions.map(time => (
            <Button
              aria-label={`${label} ${time}로 설정`}
              key={time}
              label={time}
              onClick={() => onChange(time)}
              size='sm'
              type='button'
              variant='secondary'
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function hasMatchingPeerEvaluationForm(
  milestone: Awaited<ReturnType<typeof fetchAdminSectionMilestone>>,
  input: AdminPeerEvaluationFormCreateInput,
) {
  const form = milestone.peerEvaluationForm;
  return (
    milestone.type === 'PEER_EVALUATION' &&
    form?.milestoneId === input.milestoneId &&
    form.anonymous === input.anonymous &&
    form.opensAt === input.opensAt &&
    form.closesAt === input.closesAt
  );
}

export default function AdminMilestoneSetupPage() {
  const currentUser = useAuthStore(state => state.currentUser);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const rawSearch = useSearch({ from: '/admin/milestones/new' }) as {
    milestoneId?: string | number;
    sectionId?: string | number;
  };
  // Hand-typed URLs arrive as numbers; router links serialize strings.
  const search = {
    milestoneId:
      rawSearch.milestoneId === undefined
        ? undefined
        : String(rawSearch.milestoneId),
    sectionId:
      rawSearch.sectionId === undefined
        ? undefined
        : String(rawSearch.sectionId),
  };
  const sections = currentUser?.sections ?? [];
  const editingMilestoneId =
    search.milestoneId && /^\d+$/.test(search.milestoneId)
      ? search.milestoneId
      : undefined;
  const editingSectionId =
    editingMilestoneId &&
    search.sectionId &&
    sections.some(section => section.id === search.sectionId)
      ? search.sectionId
      : undefined;
  const isEditing = Boolean(editingMilestoneId && editingSectionId);
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
  const [artifactSubmissionFailures, setArtifactSubmissionFailures] =
    useState<ReadonlySet<string>>();
  const [peerEvaluationFormFailures, setPeerEvaluationFormFailures] =
    useState<ReadonlySet<string>>();
  const [peerEvaluationFormInputs, setPeerEvaluationFormInputs] = useState<
    Readonly<Record<string, AdminPeerEvaluationFormCreateInput>>
  >({});
  const [
    presentationEvaluationWindowFailures,
    setPresentationEvaluationWindowFailures,
  ] = useState<ReadonlySet<string>>();
  const [isSubmittingPeerEvaluationForms, setIsSubmittingPeerEvaluationForms] =
    useState(false);
  const [
    isSubmittingPresentationEvaluationWindows,
    setIsSubmittingPresentationEvaluationWindows,
  ] = useState(false);
  const [peerEvaluationAnonymous, setPeerEvaluationAnonymous] = useState(true);
  const [requiredArtifactDrafts, setRequiredArtifactDrafts] = useState<
    AdminRequiredArtifactDraft[]
  >(() => createAdminRequiredArtifactDrafts(initialTemplateId));
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

  const submitMilestonesMutation = useSubmitAdminSectionMilestonesMutation();
  const submitRequiredArtifactsMutation =
    useSubmitAdminRequiredArtifactsMutation();
  const updateMilestoneMutation = useUpdateAdminSectionMilestoneMutation();
  const updateEvaluationWindowMutation =
    useUpdateAdminSectionMilestoneEvaluationWindowMutation();
  const createPeerEvaluationFormMutation =
    useCreateAdminPeerEvaluationFormMutation();
  const milestoneQuery = useAdminSectionMilestoneQuery(
    editingSectionId,
    editingMilestoneId,
  );
  const isPresentation = isEditing
    ? milestoneQuery.data?.type === 'PRESENTATION'
    : templateId === 'presentation-submit';
  const isPeerEvaluation = isEditing
    ? milestoneQuery.data?.type === 'PEER_EVALUATION'
    : templateId === 'peer-review';
  const sectionMilestonesQuery =
    useAdminSectionMilestonesQuery(editingSectionId);
  const hydratedMilestoneKey = useRef<string | undefined>(undefined);
  const sectionOptions = sections.map(section => ({
    label: `${section.code} · ${section.name}`,
    value: section.id,
  }));

  const selectedSections = sections.filter(section =>
    sectionIds.includes(section.id),
  );
  const hasFailedMilestoneCreation = submissionResults?.some(
    result => result.status === 'create-failed',
  );
  const hasRetryablePeerEvaluationForm = Boolean(
    peerEvaluationFormFailures?.size,
  );
  const hasRetryablePresentationEvaluationWindow = Boolean(
    presentationEvaluationWindowFailures?.size,
  );
  const hasNonRetryableFollowUpFailure = Boolean(
    submissionResults &&
    !hasFailedMilestoneCreation &&
    !hasRetryablePeerEvaluationForm &&
    !hasRetryablePresentationEvaluationWindow &&
    (artifactSubmissionFailures?.size ||
      submissionResults.some(result => result.status === 'publish-failed')),
  );

  useEffect(() => {
    const milestone = milestoneQuery.data;
    if (!isEditing || !milestone || !editingSectionId || !editingMilestoneId) {
      return;
    }

    const milestoneKey = `${editingSectionId}:${editingMilestoneId}`;
    if (hydratedMilestoneKey.current === milestoneKey) return;

    hydratedMilestoneKey.current = milestoneKey;
    setTitle(milestone.title);
    setDescription(milestone.description ?? '');
    setWeekNumber(String(milestone.weekNumber));
    setSectionIds([editingSectionId]);
    setSectionSchedules({
      [editingSectionId]: createAdminMilestoneSectionScheduleDraftFromDto(
        milestone.schedule,
        milestone.status,
        milestone.allowResubmissionBeforeDueAt,
        milestone.type,
        milestone.peerEvaluationForm,
      ),
    });
    if (typeof milestone.peerEvaluationForm?.anonymous === 'boolean') {
      setPeerEvaluationAnonymous(milestone.peerEvaluationForm.anonymous);
    }
  }, [editingMilestoneId, editingSectionId, isEditing, milestoneQuery.data]);

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
    setRequiredArtifactDrafts(
      createAdminRequiredArtifactDrafts(nextTemplate.id),
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(undefined);

    if (!title.trim()) {
      setFormError('마일스톤 제목을 입력해주세요.');
      return;
    }
    if (isEditing) {
      const milestone = milestoneQuery.data;
      const schedule = editingSectionId
        ? sectionSchedules[editingSectionId]
        : undefined;
      if (!milestone || !editingSectionId || !editingMilestoneId || !schedule) {
        setFormError('수정할 마일스톤 정보를 불러오지 못했습니다.');
        return;
      }

      const parsedWeekNumber = Number(weekNumber);
      if (!Number.isInteger(parsedWeekNumber) || parsedWeekNumber < 1) {
        setFormError('진행 주차는 1 이상의 정수로 입력해주세요.');
        return;
      }

      if (parsedWeekNumber !== milestone.weekNumber) {
        if (sectionMilestonesQuery.isPending) {
          setFormError(
            '기존 마일스톤 주차를 확인하는 중입니다. 잠시 후 다시 저장해주세요.',
          );
          return;
        }
        if (sectionMilestonesQuery.isError || !sectionMilestonesQuery.data) {
          setFormError(
            '기존 마일스톤 주차를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
          );
          return;
        }

        const duplicateMilestone = sectionMilestonesQuery.data.content.find(
          candidate =>
            candidate.id !== milestone.id &&
            candidate.weekNumber === parsedWeekNumber,
        );
        if (duplicateMilestone) {
          setFormError(
            `${parsedWeekNumber}주차는 '${duplicateMilestone.title}' 마일스톤이 이미 사용 중입니다. 주차 교환은 여러 마일스톤을 함께 변경하는 기능에서 지원할 예정입니다.`,
          );
          return;
        }
      }

      try {
        const result = await updateMilestoneMutation.mutateAsync({
          currentStatus: milestone.status,
          currentWeekNumber: milestone.weekNumber,
          input: createAdminMilestoneUpdateInput({
            anonymous: isPeerEvaluation ? peerEvaluationAnonymous : undefined,
            description,
            schedule,
            title,
            type: milestone.type,
          }),
          milestoneId: editingMilestoneId,
          sectionId: editingSectionId,
          status:
            milestone.status === 'CLOSED'
              ? 'CLOSED'
              : schedule.isPublished
                ? 'PUBLISHED'
                : 'DRAFT',
          weekNumber: parsedWeekNumber,
        });
        if (result.weekNumberUpdated && result.statusUpdated) {
          await navigate({
            params: { milestoneId: editingMilestoneId },
            search: { sectionId: editingSectionId },
            to: ROUTES.ADMIN_MILESTONE_DETAIL,
          });
        } else if (!result.weekNumberUpdated && !result.statusUpdated) {
          setFormError(
            '내용과 일정은 저장했지만 주차와 공개 상태 변경에 실패했습니다. 다시 시도해주세요.',
          );
        } else if (!result.weekNumberUpdated) {
          setFormError(
            '내용과 일정은 저장했지만 주차 변경에 실패했습니다. 다른 마일스톤이 해당 주차를 사용 중인지 확인한 뒤 다시 시도해주세요.',
          );
        } else {
          setFormError(
            '내용·일정·주차는 저장했지만 공개 상태 변경에 실패했습니다. 상세 화면에서 다시 시도해주세요.',
          );
        }
      } catch (error) {
        setFormError(
          isAxiosError(error)
            ? `마일스톤을 수정하지 못했습니다. ${formatAdminMilestoneRequestError(
                toAdminMilestoneRequestError(error),
              )}`
            : error instanceof Error
              ? error.message
              : '마일스톤을 수정하지 못했습니다.',
        );
      }
      return;
    }

    const parsedWeekNumber = Number(weekNumber);
    if (!Number.isInteger(parsedWeekNumber) || parsedWeekNumber < 1) {
      setFormError('진행 주차는 1 이상의 정수로 입력해주세요.');
      return;
    }
    if (selectedSections.length === 0) {
      setFormError('대상 분반을 하나 이상 선택해주세요.');
      return;
    }

    const previousResultsBySection = new Map(
      (submissionResults ?? []).map(result => [result.sectionId, result]),
    );
    const sectionsToSubmit: SubmitAdminSectionMilestonesInput['sections'][number][] =
      [];
    for (const section of selectedSections) {
      const previousResult = previousResultsBySection.get(section.id);
      if (previousResult && previousResult.status !== 'create-failed') continue;

      try {
        sectionsToSubmit.push({
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
        });
      } catch (error) {
        setFormError(
          `${getSectionLabel(section.id)}: ${
            error instanceof Error
              ? error.message
              : '마일스톤 입력값을 확인해주세요.'
          }`,
        );
        return;
      }
    }

    try {
      const newResults =
        sectionsToSubmit.length === 0
          ? []
          : await submitMilestonesMutation.mutateAsync({
              sections: sectionsToSubmit,
            });
      const resultsBySection = new Map(previousResultsBySection);
      newResults.forEach(result => {
        resultsBySection.set(result.sectionId, result);
      });
      const results = selectedSections.flatMap(section => {
        const result = resultsBySection.get(section.id);
        return result ? [result] : [];
      });
      const newlyCreatedMilestones = newResults.filter(
        (
          result,
        ): result is Exclude<
          (typeof newResults)[number],
          { status: 'create-failed' }
        > => result.status !== 'create-failed',
      );
      const nextPeerEvaluationFormInputs = {
        ...peerEvaluationFormInputs,
      };
      if (isPeerEvaluation) {
        newlyCreatedMilestones.forEach(result => {
          const submitted = sectionsToSubmit.find(
            section => section.sectionId === result.sectionId,
          );
          const evaluationOpensAt = submitted?.input.schedule.evaluationOpensAt;
          const evaluationClosesAt =
            submitted?.input.schedule.evaluationClosesAt;
          if (
            result.milestoneId !== undefined &&
            evaluationOpensAt &&
            evaluationClosesAt
          ) {
            nextPeerEvaluationFormInputs[result.sectionId] = {
              anonymous: peerEvaluationAnonymous,
              closesAt: evaluationClosesAt,
              milestoneId: result.milestoneId,
              opensAt: evaluationOpensAt,
            };
          }
        });
      }
      const artifactResults =
        requiredArtifactDrafts.length === 0
          ? []
          : await submitRequiredArtifactsMutation.mutateAsync({
              submissions: newlyCreatedMilestones.map(result => ({
                artifacts: requiredArtifactDrafts.map(draft => {
                  const { clientId, ...artifact } = draft;
                  void clientId;
                  return artifact;
                }),
                milestoneId: String(result.milestoneId),
                sectionId: result.sectionId,
              })),
            });
      const peerEvaluationMilestones = isPeerEvaluation
        ? results.filter(
            (
              result,
            ): result is Exclude<
              (typeof results)[number],
              { status: 'create-failed' }
            > =>
              result.status !== 'create-failed' &&
              (newResults.some(
                newResult => newResult.sectionId === result.sectionId,
              ) ||
                peerEvaluationFormFailures?.has(result.sectionId) === true),
          )
        : [];
      const presentationMilestones = isPresentation
        ? results.filter(
            (
              result,
            ): result is Exclude<
              (typeof results)[number],
              { status: 'create-failed' }
            > =>
              result.status !== 'create-failed' &&
              Boolean(
                sectionSchedules[result.sectionId]?.evaluationOpensAt.date &&
                sectionSchedules[result.sectionId]?.evaluationOpensAt.time &&
                sectionSchedules[result.sectionId]?.evaluationClosesAt.date &&
                sectionSchedules[result.sectionId]?.evaluationClosesAt.time,
              ) &&
              (newResults.some(
                newResult => newResult.sectionId === result.sectionId,
              ) ||
                presentationEvaluationWindowFailures?.has(result.sectionId) ===
                  true),
          )
        : [];
      const presentationEvaluationWindowResults = isPresentation
        ? await Promise.all(
            presentationMilestones.map(async result => {
              const schedule = sectionSchedules[result.sectionId];
              const opensAtDraft = schedule
                ? toAdminMilestoneDateTime(schedule.evaluationOpensAt)
                : undefined;
              const closesAtDraft = schedule
                ? toAdminMilestoneDateTime(schedule.evaluationClosesAt)
                : undefined;
              const evaluationOpensAt = opensAtDraft
                ? toPresentationEvaluationServerDateTime(opensAtDraft)
                : undefined;
              const evaluationClosesAt = closesAtDraft
                ? toPresentationEvaluationServerDateTime(closesAtDraft)
                : undefined;

              if (
                !evaluationOpensAt ||
                !evaluationClosesAt ||
                result.milestoneId === undefined
              )
                return { sectionId: result.sectionId };

              try {
                setIsSubmittingPresentationEvaluationWindows(true);
                await updateEvaluationWindowMutation.mutateAsync({
                  input: { evaluationClosesAt, evaluationOpensAt },
                  milestoneId: String(result.milestoneId),
                  sectionId: result.sectionId,
                });
                return { sectionId: result.sectionId, succeeded: true };
              } catch {
                return { sectionId: result.sectionId };
              }
            }),
          )
        : [];
      const peerEvaluationFormResults = isPeerEvaluation
        ? await Promise.all(
            peerEvaluationMilestones.map(async result => {
              const input = nextPeerEvaluationFormInputs[result.sectionId];
              if (!input) return { sectionId: result.sectionId };

              const detailQueryKey = adminSectionMilestoneKeys.detail(
                result.sectionId,
                String(input.milestoneId),
              );
              const invalidateMilestoneQueries = () =>
                Promise.all([
                  queryClient.invalidateQueries({
                    queryKey: adminSectionMilestoneKeys.list(result.sectionId),
                  }),
                  queryClient.invalidateQueries({ queryKey: detailQueryKey }),
                ]);

              try {
                setIsSubmittingPeerEvaluationForms(true);
                await createPeerEvaluationFormMutation.mutateAsync({
                  input,
                  sectionId: result.sectionId,
                });
                await invalidateMilestoneQueries();
                return { sectionId: result.sectionId, succeeded: true };
              } catch (error) {
                const isAlreadyCreated =
                  isAxiosError<{ code?: string }>(error) &&
                  error.response?.status === 409 &&
                  error.response.data?.code ===
                    'PEER_EVALUATION_FORM_ALREADY_EXISTS';
                if (!isAlreadyCreated) return { sectionId: result.sectionId };

                try {
                  await queryClient.invalidateQueries({
                    queryKey: detailQueryKey,
                    refetchType: 'none',
                  });
                  const milestone = await queryClient.fetchQuery({
                    queryFn: () =>
                      fetchAdminSectionMilestone(
                        result.sectionId,
                        String(input.milestoneId),
                      ),
                    queryKey: detailQueryKey,
                  });
                  if (!hasMatchingPeerEvaluationForm(milestone, input))
                    return { sectionId: result.sectionId };

                  await queryClient.invalidateQueries({
                    queryKey: adminSectionMilestoneKeys.list(result.sectionId),
                  });
                  return { sectionId: result.sectionId, succeeded: true };
                } catch {
                  return { sectionId: result.sectionId };
                }
              }
            }),
          )
        : [];
      const nextArtifactSubmissionFailures = new Set(
        artifactSubmissionFailures,
      );
      artifactResults.forEach(result => {
        if (result.failedCount > 0)
          nextArtifactSubmissionFailures.add(result.sectionId);
        else nextArtifactSubmissionFailures.delete(result.sectionId);
      });
      const nextPeerEvaluationFormFailures = new Set(
        peerEvaluationFormFailures,
      );
      peerEvaluationFormResults.forEach(result => {
        if (result.succeeded) {
          nextPeerEvaluationFormFailures.delete(result.sectionId);
          delete nextPeerEvaluationFormInputs[result.sectionId];
        } else nextPeerEvaluationFormFailures.add(result.sectionId);
      });
      const nextPresentationEvaluationWindowFailures = new Set(
        presentationEvaluationWindowFailures,
      );
      presentationEvaluationWindowResults.forEach(result => {
        if (result.succeeded)
          nextPresentationEvaluationWindowFailures.delete(result.sectionId);
        else nextPresentationEvaluationWindowFailures.add(result.sectionId);
      });
      setSubmissionResults(results);
      setArtifactSubmissionFailures(nextArtifactSubmissionFailures);
      setPeerEvaluationFormFailures(nextPeerEvaluationFormFailures);
      setPeerEvaluationFormInputs(nextPeerEvaluationFormInputs);
      setPresentationEvaluationWindowFailures(
        nextPresentationEvaluationWindowFailures,
      );
      if (nextPresentationEvaluationWindowFailures.size > 0) {
        setFormError('마일스톤을 저장하지 못했습니다.');
      }

      const createdWithoutFollowUpFailure =
        results.length > 0 &&
        results.every(
          result =>
            result.status === 'created' || result.status === 'published',
        ) &&
        artifactResults.every(result => result.failedCount === 0) &&
        nextArtifactSubmissionFailures.size === 0 &&
        peerEvaluationFormResults.every(result => result.succeeded) &&
        nextPeerEvaluationFormFailures.size === 0 &&
        presentationEvaluationWindowResults.every(result => result.succeeded) &&
        nextPresentationEvaluationWindowFailures.size === 0;

      if (createdWithoutFollowUpFailure) {
        await navigate({
          search:
            results.length === 1 ? { sectionId: results[0]!.sectionId } : {},
          to: ROUTES.ADMIN_MILESTONES,
        });
      }
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : '마일스톤을 저장하지 못했습니다.',
      );
    } finally {
      setIsSubmittingPeerEvaluationForms(false);
      setIsSubmittingPresentationEvaluationWindows(false);
    }
  };

  const getSectionLabel = (sectionId: string) => {
    const section = sections.find(candidate => candidate.id === sectionId);
    return section ? `${section.code} · ${section.name}` : sectionId;
  };

  if (editingMilestoneId && !editingSectionId) {
    return (
      <div className={styles.page}>
        <EmptyState
          description='담당 분반의 마일스톤만 수정할 수 있습니다.'
          title='수정할 수 없는 분반입니다.'
        />
      </div>
    );
  }

  if (isEditing && milestoneQuery.isPending) {
    return (
      <div className={styles.page}>
        <Text aria-live='polite' role='status'>
          마일스톤 정보를 불러오는 중입니다.
        </Text>
      </div>
    );
  }

  if (isEditing && milestoneQuery.isError) {
    return (
      <div className={styles.page}>
        <EmptyState
          description='잠시 후 다시 시도해주세요.'
          title='마일스톤 정보를 불러오지 못했습니다.'
        />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <Heading level={1}>
            {isEditing ? '마일스톤 수정' : '마일스톤 설정'}
          </Heading>
          <Text color='secondary' type='supporting'>
            {isEditing
              ? '선택한 분반의 마일스톤 내용과 운영 일정을 수정합니다.'
              : isPresentation
                ? '기본 양식을 선택하고 담당 분반의 발표 자료 제출·평가 일정을 준비합니다.'
                : '기본 양식을 선택하고 담당 분반의 공개 일정과 마감 일시를 준비합니다.'}
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
            {isEditing ? (
              <>
                <Text weight='medium'>대상 분반</Text>
                <Text color='secondary' type='supporting'>
                  {editingSectionId ? getSectionLabel(editingSectionId) : '-'}
                </Text>
                <Text weight='medium'>마일스톤 유형</Text>
                <Text color='secondary' type='supporting'>
                  {milestoneQuery.data
                    ? getAdminMilestoneTypeLabel(milestoneQuery.data.type)
                    : '-'}
                </Text>
              </>
            ) : (
              <>
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
                  {isPresentation || isPeerEvaluation
                    ? isPresentation
                      ? '선택한 분반마다 발표 자료 제출·평가 기간과 공개 상태를 따로 설정합니다.'
                      : '선택한 분반마다 상호 평가 기간과 공개 상태를 따로 설정합니다.'
                    : '선택한 분반마다 공개 일정과 공개 상태를 따로 설정합니다.'}{' '}
                  저장하면 선택한 분반별로 독립된 요청이 전송됩니다.
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
              </>
            )}
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
              {isEditing ? (
                <Text color='secondary' type='supporting'>
                  주차를 변경해도 공개·제출 일정은 자동으로 변경되지 않습니다.
                  이미 사용 중인 주차는 선택할 수 없습니다.
                </Text>
              ) : null}
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
                        {!isPeerEvaluation ? (
                          <div className={styles.scheduleField}>
                            <div className={styles.scheduleInputs}>
                              <DateInput
                                hasClear
                                label={`${section.code} 공개 시작일`}
                                onChange={date =>
                                  updateSectionSchedule(
                                    section.id,
                                    current => ({
                                      ...current,
                                      opensAt: {
                                        ...current.opensAt,
                                        date: date ?? '',
                                      },
                                    }),
                                  )
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
                              <ScheduleTimeInput
                                label={`${section.code} 공개 시작 시간`}
                                onChange={time =>
                                  updateSectionSchedule(
                                    section.id,
                                    current => ({
                                      ...current,
                                      opensAt: { ...current.opensAt, time },
                                    }),
                                  )
                                }
                                value={schedule.opensAt.time}
                              />
                            </div>
                          </div>
                        ) : null}
                        {!isPeerEvaluation ? (
                          <div className={styles.scheduleField}>
                            <div className={styles.scheduleInputs}>
                              <DateInput
                                hasClear
                                label={`${section.code} 제출 마감일`}
                                onChange={date =>
                                  updateSectionSchedule(
                                    section.id,
                                    current => ({
                                      ...current,
                                      dueAt: {
                                        ...current.dueAt,
                                        date: date ?? '',
                                      },
                                    }),
                                  )
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
                              <ScheduleTimeInput
                                label={`${section.code} 제출 마감 시간`}
                                onChange={time =>
                                  updateSectionSchedule(
                                    section.id,
                                    current => ({
                                      ...current,
                                      dueAt: { ...current.dueAt, time },
                                    }),
                                  )
                                }
                                value={schedule.dueAt.time}
                              />
                            </div>
                          </div>
                        ) : null}
                      </div>
                      {isPresentation || isPeerEvaluation ? (
                        <div className={styles.scheduleField}>
                          <Text weight='medium'>
                            {isPresentation
                              ? '발표 평가 기간'
                              : '상호 평가 기간'}
                          </Text>
                          <Text color='secondary' type='supporting'>
                            {isPresentation
                              ? '학생이 다른 팀의 발표를 평가할 수 있는 기간입니다. 자료 제출 마감 이후로 설정해야 하며, 비워 두면 발표 평가 탭과 학생 발표 평가가 열리지 않습니다. 팀별 발표 순서와 평가 항목은 제출물 관리 화면에서 설정합니다.'
                              : '학생이 팀원을 평가할 수 있는 기간입니다.'}
                          </Text>
                          <div className={styles.scheduleGrid}>
                            <div className={styles.scheduleField}>
                              <div className={styles.scheduleInputs}>
                                <DateInput
                                  hasClear
                                  label={`${section.code} ${isPresentation ? '발표 평가' : '상호 평가'} 시작일`}
                                  onChange={date =>
                                    updateSectionSchedule(
                                      section.id,
                                      current => ({
                                        ...current,
                                        evaluationOpensAt: {
                                          ...current.evaluationOpensAt,
                                          date: date ?? '',
                                        },
                                      }),
                                    )
                                  }
                                  placeholder='날짜 선택'
                                  value={
                                    schedule.evaluationOpensAt.date
                                      ? (schedule.evaluationOpensAt
                                          .date as `${number}${number}${number}${number}-${number}${number}-${number}${number}`)
                                      : undefined
                                  }
                                  width='100%'
                                />
                                <ScheduleTimeInput
                                  label={`${section.code} 평가 시작 시간`}
                                  onChange={time =>
                                    updateSectionSchedule(
                                      section.id,
                                      current => ({
                                        ...current,
                                        evaluationOpensAt: {
                                          ...current.evaluationOpensAt,
                                          time,
                                        },
                                      }),
                                    )
                                  }
                                  value={schedule.evaluationOpensAt.time}
                                />
                              </div>
                            </div>
                            <div className={styles.scheduleField}>
                              <div className={styles.scheduleInputs}>
                                <DateInput
                                  hasClear
                                  label={`${section.code} ${isPresentation ? '발표 평가' : '상호 평가'} 종료일`}
                                  onChange={date =>
                                    updateSectionSchedule(
                                      section.id,
                                      current => ({
                                        ...current,
                                        evaluationClosesAt: {
                                          ...current.evaluationClosesAt,
                                          date: date ?? '',
                                        },
                                      }),
                                    )
                                  }
                                  placeholder='날짜 선택'
                                  value={
                                    schedule.evaluationClosesAt.date
                                      ? (schedule.evaluationClosesAt
                                          .date as `${number}${number}${number}${number}-${number}${number}-${number}${number}`)
                                      : undefined
                                  }
                                  width='100%'
                                />
                                <ScheduleTimeInput
                                  label={`${section.code} 평가 종료 시간`}
                                  onChange={time =>
                                    updateSectionSchedule(
                                      section.id,
                                      current => ({
                                        ...current,
                                        evaluationClosesAt: {
                                          ...current.evaluationClosesAt,
                                          time,
                                        },
                                      }),
                                    )
                                  }
                                  value={schedule.evaluationClosesAt.time}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : null}
                      {isPeerEvaluation &&
                      section.id === selectedSections[0]?.id ? (
                        <Selector
                          aria-label={`${section.code} 상호 평가 익명 여부`}
                          label='평가 결과 익명 공개'
                          description='선택한 모든 분반의 상호평가 양식에 동일하게 적용됩니다.'
                          onChange={value =>
                            setPeerEvaluationAnonymous(value === 'anonymous')
                          }
                          options={[
                            { label: '익명 공개', value: 'anonymous' },
                            { label: '실명 공개', value: 'identified' },
                          ]}
                          renderOption={option => (
                            <SelectorOption
                              label={option.label ?? option.value}
                            />
                          )}
                          value={
                            peerEvaluationAnonymous ? 'anonymous' : 'identified'
                          }
                          width={180}
                        />
                      ) : null}
                      {isEditing && milestoneQuery.data?.status === 'CLOSED' ? (
                        <div className={styles.scheduleField}>
                          <Text weight='medium'>공개 상태</Text>
                          <Text color='secondary' type='supporting'>
                            마감됨 — 이 화면에서는 마감 상태를 변경하지
                            않습니다.
                          </Text>
                        </div>
                      ) : (
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
                      )}
                      {!isPeerEvaluation ? (
                        <>
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
                                    updateSectionSchedule(
                                      section.id,
                                      current => ({
                                        ...current,
                                        lateSubmissionUntil: {
                                          ...current.lateSubmissionUntil,
                                          date: date ?? '',
                                        },
                                      }),
                                    )
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
                        </>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {isEditing && editingSectionId && editingMilestoneId ? (
            <AdminRequiredArtifactsManager
              milestoneId={editingMilestoneId}
              sectionId={editingSectionId}
            />
          ) : null}

          {!isEditing ? (
            <section className={styles.section}>
              <Heading className={styles.sectionTitle} level={2}>
                선택한 프리셋
              </Heading>
              <Text color='secondary' type='supporting'>
                {getTemplate(templateId).label} 프리셋을 선택했습니다. 아래
                산출물 초안은 저장 전까지 자유롭게 수정할 수 있습니다.
              </Text>
            </section>
          ) : null}

          {!isEditing ? (
            <AdminRequiredArtifactDraftEditor
              onChange={setRequiredArtifactDrafts}
              value={requiredArtifactDrafts}
            />
          ) : null}

          <div className={styles.action}>
            <Text className={styles.actionNote} type='supporting'>
              {isEditing
                ? '내용과 일정을 저장한 뒤, 변경된 경우에만 주차와 공개 상태 변경 요청을 각각 전송합니다.'
                : hasFailedMilestoneCreation || hasRetryablePeerEvaluationForm
                  ? '다시 저장하면 실패한 마일스톤 생성 또는 상호평가 양식만 재시도합니다.'
                  : '공개를 선택하면 생성 후 공개 상태 변경 요청을 한 번 더 전송합니다.'}
            </Text>
            {formError ? (
              <Text className={styles.formError} role='alert'>
                {formError}
              </Text>
            ) : null}
            {!isEditing && submissionResults ? (
              <ul aria-live='polite' className={styles.resultList}>
                {submissionResults.map(result => (
                  <li key={result.sectionId}>
                    {getSectionLabel(result.sectionId)}:{' '}
                    {result.status === 'published'
                      ? '생성하고 공개했습니다.'
                      : result.status === 'created'
                        ? '미공개 마일스톤으로 생성했습니다.'
                        : result.status === 'publish-failed'
                          ? `생성했지만 공개 상태 변경에 실패했습니다. 목록에서 다시 공개할 수 있습니다.${
                              result.error
                                ? ` (${formatAdminMilestoneRequestError(result.error)})`
                                : ''
                            }`
                          : `생성에 실패했습니다.${
                              result.failureMessage
                                ? ` ${result.failureMessage}`
                                : ''
                            }${
                              result.error
                                ? ` ${formatAdminMilestoneRequestError(result.error)}`
                                : ''
                            }`}
                    {artifactSubmissionFailures?.has(result.sectionId)
                      ? ' 산출물 일부 등록에 실패했습니다. 마일스톤 수정 화면에서 다시 추가해주세요.'
                      : ''}
                    {peerEvaluationFormFailures?.has(result.sectionId)
                      ? ' 상호평가 양식 생성에 실패했습니다. 마일스톤은 생성되었으므로 관리자에게 양식 생성 재시도 방법을 확인해주세요.'
                      : ''}
                  </li>
                ))}
              </ul>
            ) : null}
            <Link
              params={
                isEditing && editingMilestoneId
                  ? { milestoneId: editingMilestoneId }
                  : undefined
              }
              search={
                isEditing && editingSectionId
                  ? { sectionId: editingSectionId }
                  : undefined
              }
              to={
                isEditing
                  ? ROUTES.ADMIN_MILESTONE_DETAIL
                  : ROUTES.ADMIN_MILESTONES
              }
            >
              취소
            </Link>
            <Button
              isDisabled={
                submitMilestonesMutation.isPending ||
                submitRequiredArtifactsMutation.isPending ||
                isSubmittingPeerEvaluationForms ||
                isSubmittingPresentationEvaluationWindows ||
                updateMilestoneMutation.isPending ||
                hasNonRetryableFollowUpFailure
              }
              isLoading={
                submitMilestonesMutation.isPending ||
                submitRequiredArtifactsMutation.isPending ||
                isSubmittingPeerEvaluationForms ||
                isSubmittingPresentationEvaluationWindows ||
                updateMilestoneMutation.isPending
              }
              label={
                hasFailedMilestoneCreation ||
                hasRetryablePeerEvaluationForm ||
                hasRetryablePresentationEvaluationWindow
                  ? '실패한 작업 다시 시도'
                  : '저장'
              }
              type='submit'
              variant='primary'
            />
          </div>
        </form>
      </Card>
    </div>
  );
}
