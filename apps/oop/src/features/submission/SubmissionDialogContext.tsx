import {
  createContext,
  type PropsWithChildren,
  useContext,
  useState,
} from 'react';

export type SubmissionDialogMilestoneId = 'presentation' | 'final-report';

type SubmissionDialogContextValue = {
  closeDialog: () => void;
  milestoneId: SubmissionDialogMilestoneId | null;
  openDialog: (milestoneId: SubmissionDialogMilestoneId) => void;
};

const SubmissionDialogContext = createContext<SubmissionDialogContextValue>({
  closeDialog: () => undefined,
  milestoneId: null,
  openDialog: () => undefined,
});

export function SubmissionDialogProvider({ children }: PropsWithChildren) {
  const [milestoneId, setMilestoneId] =
    useState<SubmissionDialogMilestoneId | null>(null);

  return (
    <SubmissionDialogContext.Provider
      value={{
        closeDialog: () => setMilestoneId(null),
        milestoneId,
        openDialog: setMilestoneId,
      }}
    >
      {children}
    </SubmissionDialogContext.Provider>
  );
}

export function useSubmissionDialog() {
  return useContext(SubmissionDialogContext);
}
