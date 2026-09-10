import {
  createContext,
  type PropsWithChildren,
  useContext,
  useState,
} from 'react';

import type { FinalReportSubmissionTarget } from './FinalReportSubmissionPanel';

export type SubmissionDialogMilestoneId = 'presentation' | 'final-report';

type SubmissionDialogContextValue = {
  finalReportTargets: Record<string, FinalReportSubmissionTarget>;
  target: FinalReportSubmissionTarget | null;
  closeDialog: () => void;
  milestoneId: SubmissionDialogMilestoneId | null;
  openDialog: (
    milestoneId: SubmissionDialogMilestoneId,
    actualMilestoneId?: string,
  ) => void;
};

const SubmissionDialogContext = createContext<SubmissionDialogContextValue>({
  finalReportTargets: {},
  target: null,
  closeDialog: () => undefined,
  milestoneId: null,
  openDialog: () => undefined,
});

export function SubmissionDialogProvider({
  children,
  finalReportTargets = {},
}: PropsWithChildren<{
  finalReportTargets?: Record<string, FinalReportSubmissionTarget>;
}>) {
  const [actualId, setActualId] = useState<string>();
  const [milestoneId, setMilestoneId] =
    useState<SubmissionDialogMilestoneId | null>(null);

  return (
    <SubmissionDialogContext.Provider
      value={{
        finalReportTargets,
        target: actualId ? (finalReportTargets[actualId] ?? null) : null,
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
