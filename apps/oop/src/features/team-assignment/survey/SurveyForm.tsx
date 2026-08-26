import type {
  TeamAssignmentProjection,
  TeamAssignmentSurvey,
  TeamRolePreference,
} from '@aics/core';
import {
  Button,
  CheckboxList,
  CheckboxListItem,
  Dialog,
  Field,
  Heading,
  HStack,
  Text,
  TextArea,
  VStack,
} from '@aics/design-system';
import { useState } from 'react';

import { SurveyFlow, SurveyQuestion } from '~/shared/ui/SurveyFlow';

import { useSubmitTeamAssignmentSurveyMutation } from '../queries';
import * as styles from '../TeamAssignmentFlow.css';
import { PartnerRequestPanel } from './PartnerRequestPanel';

const roleOptions: Array<{ label: string; value: TeamRolePreference }> = [
  { label: '팀장(프로젝트 매니저)', value: 'TEAM_LEADER' },
  { label: '개발', value: 'DEVELOPMENT' },
  { label: '자료수집', value: 'RESEARCH' },
  { label: '디자인', value: 'DESIGN' },
  { label: '문서 작성 및 발표', value: 'DOCUMENTATION_PRESENTATION' },
];
const stepLabels = ['소개', '역할과 팀원', '주제와 의견'];

type SurveyFormProps = { projection: TeamAssignmentProjection };

export function SurveyForm({ projection }: SurveyFormProps) {
  const submitSurvey = useSubmitTeamAssignmentSurveyMutation();
  const [step, setStep] = useState(0);
  const [requestError, setRequestError] = useState<string>();
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
  const [survey, setSurvey] = useState<TeamAssignmentSurvey>(
    projection.survey ?? { note: '', rolePreferences: [], topicIdea: '' },
  );
  const hasRole = survey.rolePreferences.length > 0;
  const hasIncomingPartnerRequest = Boolean(projection.incomingPartnerRequest);

  function updateSurvey<K extends keyof TeamAssignmentSurvey>(
    key: K,
    value: TeamAssignmentSurvey[K],
  ) {
    setSurvey(current => ({ ...current, [key]: value }));
  }

  function moveToStep(nextStep: number) {
    if (nextStep > step) return;
    setRequestError(undefined);
    setStep(nextStep);
  }

  function continueSurvey() {
    setRequestError(undefined);
    if (hasIncomingPartnerRequest) {
      setRequestError(
        '받은 파트너 신청을 승인하거나 거절한 뒤 다음 설문으로 이동할 수 있어요.',
      );
      setStep(1);
      return;
    }
    if (step === 2) {
      setSubmitConfirmOpen(true);
      return;
    }
    setStep(current => current + 1);
  }

  async function submit() {
    setRequestError(undefined);
    try {
      await submitSurvey.mutateAsync({
        sectionId: projection.sectionId,
        survey,
      });
      setSubmitConfirmOpen(false);
    } catch {
      setSubmitConfirmOpen(false);
      setRequestError('설문 기간 또는 제출 상태를 다시 확인해 주세요.');
    }
  }

  const surveyActions = (
    <Button
      isDisabled={
        (step === 1 && !hasRole) || (step > 0 && hasIncomingPartnerRequest)
      }
      label={step === 0 ? '시작하기' : step === 2 ? '설문 제출' : '다음 설문'}
      onClick={continueSurvey}
      variant='secondary'
    />
  );

  return (
    <>
      <SurveyFlow
        actions={surveyActions}
        activeStep={step}
        ariaLabel='팀 구성 설문'
        centered={step === 0}
        onStepChange={moveToStep}
        steps={stepLabels.map((label, index) => ({
          label,
          isDisabled: index > step,
        }))}
      >
        {step === 0 ? (
          <div className={styles.centeredCopy}>
            <img
              alt='팀프로젝트 설문 안내'
              className={styles.illustration}
              src='/team-survey-illustration.svg'
            />
            <Text as='h2' type='label' weight='semibold'>
              팀프로젝트 팀구성을 위한 설문에 응답해 주세요.
            </Text>
            <Text as='p' color='secondary' type='supporting'>
              마감 전까지 응답할 수 있어요.
            </Text>
          </div>
        ) : null}
        {step === 1 ? (
          <SurveyQuestion
            description='함께하고 싶은 팀원과 맡고 싶은 역할을 알려주세요.'
            title='역할과 팀원'
          >
            <PartnerRequestPanel projection={projection} />
            <Field
              inputID='team-role-preferences'
              isGroupLabel
              isRequired
              label='팀에서 자신이 하고 싶은 역할을 모두 골라주세요.'
              labelID='team-role-preferences-label'
              status={
                !hasRole
                  ? {
                      message: '역할을 하나 이상 선택해 주세요.',
                      type: 'error',
                    }
                  : undefined
              }
              statusVariant='detached'
            >
              <CheckboxList
                aria-labelledby='team-role-preferences-label'
                description='하나 이상 선택해 주세요.'
                id='team-role-preferences'
                isLabelHidden
                label='팀에서 자신이 하고 싶은 역할을 모두 골라주세요.'
                onChange={values =>
                  updateSurvey(
                    'rolePreferences',
                    values as TeamRolePreference[],
                  )
                }
                value={survey.rolePreferences}
              >
                {roleOptions.map(option => (
                  <CheckboxListItem
                    key={option.value}
                    label={option.label}
                    value={option.value}
                  />
                ))}
              </CheckboxList>
            </Field>
          </SurveyQuestion>
        ) : null}
        {step === 2 ? (
          <SurveyQuestion
            description='생각해 둔 주제나 팀 구성에 필요한 의견을 남겨주세요.'
            title='주제와 의견'
          >
            <TextArea
              isOptional
              label='프로젝트 주제 아이디어'
              onChange={value => updateSurvey('topicIdea', value)}
              value={survey.topicIdea}
            />
            <TextArea
              isOptional
              label='요청 또는 메모'
              onChange={value => updateSurvey('note', value)}
              value={survey.note ?? ''}
            />
          </SurveyQuestion>
        ) : null}
        {requestError ? (
          <Text as='p' color='secondary' role='alert' type='supporting'>
            {requestError}
          </Text>
        ) : null}
      </SurveyFlow>
      <Dialog
        aria-label='설문 제출 확인'
        isOpen={submitConfirmOpen}
        onOpenChange={setSubmitConfirmOpen}
        purpose='form'
      >
        <VStack gap={4}>
          <VStack gap={2}>
            <Heading level={2}>설문을 제출할까요?</Heading>
            <Text color='secondary'>
              제출 후에는 팀 선정 결과가 공개될 때까지 응답을 수정할 수 없어요.
            </Text>
          </VStack>
          <HStack gap={2} justify='end'>
            <Button
              label='이전 설문으로 돌아가기'
              onClick={() => {
                setSubmitConfirmOpen(false);
                setStep(1);
              }}
              variant='secondary'
            />
            <Button
              isLoading={submitSurvey.isPending}
              label='제출'
              onClick={() => void submit()}
              variant='primary'
            />
          </HStack>
        </VStack>
      </Dialog>
    </>
  );
}
