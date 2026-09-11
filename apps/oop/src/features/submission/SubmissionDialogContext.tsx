import {
  createContext,
  type PropsWithChildren,
  useContext,
  useState,
} from 'react';

import type { StudentSubmissionTarget } from './StudentSubmissionPanel';

export type SubmissionDialogMilestoneId = 'presentation' | 'final-report';

type SubmissionDialogContextValue = {
  submissionTargets: Record<string, StudentSubmissionTarget>;
  target: StudentSubmissionTarget | null;
  closeDialog: () => void;
  milestoneId: SubmissionDialogMilestoneId | null;
  openDialog: (
    milestoneId: SubmissionDialogMilestoneId,
    actualMilestoneId?: string,
  ) => void;
};

const SubmissionDialogContext = createContext<SubmissionDialogContextValue>({
  submissionTargets: {},
  target: null,
  closeDialog: () => undefined,
  milestoneId: null,
  openDialog: () => undefined,
});

export function SubmissionDialogProvider({
  children,
  submissionTargets = {},
}: PropsWithChildren<{
  submissionTargets?: Record<string, StudentSubmissionTarget>;
}>) {
  const [actualId, setActualId] = useState<string>();
  const [milestoneId, setMilestoneId] =
    useState<SubmissionDialogMilestoneId | null>(null);

  return (
    <SubmissionDialogContext.Provider
      value={{
        submissionTargets,
        target:
          actualId &&
          submissionTargets[actualId]?.type ===
            (milestoneId === 'presentation' ? 'PRESENTATION' : 'FINAL_REPORT')
            ? submissionTargets[actualId]
            : null,
        closeDialog: () => {
          setMilestoneId(null);
          setActualId(undefined);
        },
        milestoneId,
        openDialog: (kind, id) => {
          setMilestoneId(kind);
          setActualId(id);
        },
      }}
    >
      {children}
    </SubmissionDialogContext.Provider>
  );
}

export function useSubmissionDialog() {
  return useContext(SubmissionDialogContext);
}
