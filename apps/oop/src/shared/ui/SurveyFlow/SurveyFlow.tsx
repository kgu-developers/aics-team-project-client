import { Tab, TabList, Text } from '@aics/design-system';
import { type ReactNode, useId } from 'react';

import * as styles from './SurveyFlow.css';

export type SurveyFlowStep = {
  label: string;
  isDisabled?: boolean;
};

type SurveyFlowProps = {
  actions: ReactNode;
  activeStep: number;
  ariaLabel: string;
  centered?: boolean;
  children: ReactNode;
  onStepChange: (step: number) => void;
  steps: SurveyFlowStep[];
};

export function SurveyFlow({
  actions,
  activeStep,
  ariaLabel,
  centered = false,
  children,
  onStepChange,
  steps,
}: SurveyFlowProps) {
  function handleStepChange(value: string) {
    const nextStep = Number(value);
    if (
      !Number.isInteger(nextStep) ||
      nextStep < 0 ||
      nextStep >= steps.length ||
      steps[nextStep]?.isDisabled
    ) {
      return;
    }
    onStepChange(nextStep);
  }

  return (
    <section aria-label={ariaLabel} className={styles.page}>
      <div className={styles.flowBody}>
        <TabList
          aria-label={`${ariaLabel} 단계`}
          className={styles.stepper}
          onChange={handleStepChange}
          size='sm'
          value={String(activeStep)}
        >
          {steps.map((step, index) => (
            <Tab
              aria-disabled={step.isDisabled || undefined}
              key={step.label}
              label={`${index + 1}. ${step.label}`}
              value={String(index)}
            />
          ))}
        </TabList>
        <div
          className={`${styles.content} ${centered ? styles.centeredContent : ''}`}
        >
          {children}
          <div
            className={`${styles.actions} ${centered ? styles.centeredActions : ''}`}
          >
            {actions}
          </div>
        </div>
      </div>
    </section>
  );
}

type SurveyQuestionProps = {
  children: ReactNode;
  description?: ReactNode;
  title: string;
};

export function SurveyQuestion({
  children,
  description,
  title,
}: SurveyQuestionProps) {
  const titleId = useId();

  return (
    <section aria-labelledby={titleId} className={styles.question}>
      <div className={styles.questionCopy}>
        <Text
          as='h2'
          className={styles.questionTitle}
          id={titleId}
          type='label'
          weight='semibold'
        >
          {title}
        </Text>
        {description ? (
          <Text
            as='p'
            className={styles.questionDescription}
            color='secondary'
            type='supporting'
          >
            {description}
          </Text>
        ) : null}
      </div>
      <div className={styles.fields}>{children}</div>
    </section>
  );
}
