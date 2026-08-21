import {
  createContext,
  type PropsWithChildren,
  useContext,
  useState,
} from 'react';

type FinalReportSubmissionDialogContextValue = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

const FinalReportSubmissionDialogContext =
  createContext<FinalReportSubmissionDialogContextValue>({
    isOpen: false,
    setIsOpen: () => undefined,
  });

export function FinalReportSubmissionDialogProvider({
  children,
}: PropsWithChildren) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <FinalReportSubmissionDialogContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </FinalReportSubmissionDialogContext.Provider>
  );
}

export function useFinalReportSubmissionDialog() {
  return useContext(FinalReportSubmissionDialogContext);
}
