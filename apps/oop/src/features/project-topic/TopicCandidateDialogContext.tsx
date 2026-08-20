import {
  createContext,
  type PropsWithChildren,
  useContext,
  useState,
} from 'react';

type TopicCandidateDialogContextValue = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

const TopicCandidateDialogContext =
  createContext<TopicCandidateDialogContextValue>({
    isOpen: false,
    setIsOpen: () => undefined,
  });

export function TopicCandidateDialogProvider({ children }: PropsWithChildren) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <TopicCandidateDialogContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </TopicCandidateDialogContext.Provider>
  );
}

export function useTopicCandidateDialog() {
  return useContext(TopicCandidateDialogContext);
}
