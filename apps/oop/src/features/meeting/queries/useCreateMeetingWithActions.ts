import type { CreateMeetingRecordInput, MeetingPhase } from '@aics/core';
import { useRef, useState } from 'react';

import { isMockDevelopmentMode } from '~/shared/config/developmentMode';

import { useSubmitMeetingActionMutation } from './useSubmitMeetingActionMutation';
import { useSubmitMeetingRecordMutation } from './useSubmitMeetingRecordMutation';
import { actionSaveError, isActionCreateUncertain } from '../model/actionPlan';
import { MeetingCreateError } from '../model/meetingCreateError';

export function useCreateMeetingWithActions() {
  const createRecord = useSubmitMeetingRecordMutation();
  const createAction = useSubmitMeetingActionMutation();
  const isDemo = isMockDevelopmentMode(
    import.meta.env.DEV,
    import.meta.env.VITE_ENABLE_MSW,
  );
  const receipt = useRef<{ meetingId?: string; saved: number[] }>({
    saved: [],
  });
  const running = useRef(false);
  const uncertainRef = useRef(false);
  const [isPending, setPending] = useState(false);
  const [meetingId, setMeetingId] = useState<string>();
  const [savedActionIndexes, setSavedActionIndexes] = useState<number[]>([]);
  const [error, setError] = useState<string>();
  const [isUncertain, setUncertain] = useState(false);

  const save = async (args: {
    input: CreateMeetingRecordInput;
    teamId: string;
    phase: MeetingPhase;
  }): Promise<{ id: string } | undefined> => {
    if (running.current || uncertainRef.current) return;
    running.current = true;
    setPending(true);
    setError(undefined);
    try {
      if (!receipt.current.meetingId) {
        const record = await createRecord.mutateAsync(args);
        receipt.current.meetingId = record.id;
        setMeetingId(record.id);
      }
      const id = receipt.current.meetingId;
      if (!isDemo) {
        // After the record is saved, the form keeps row order fixed. Successful
        // indexes are receipts, so retrying a later row cannot replay an earlier POST.
        for (const [index, input] of args.input.actions.entries()) {
          if (receipt.current.saved.includes(index)) continue;
          await createAction.mutateAsync({
            teamId: args.teamId,
            meetingId: id,
            input,
          });
          receipt.current.saved.push(index);
          setSavedActionIndexes([...receipt.current.saved]);
        }
      }
      return { id };
    } catch (cause) {
      const recordSaved = Boolean(receipt.current.meetingId);
      const uncertain = recordSaved
        ? isActionCreateUncertain(cause)
        : cause instanceof MeetingCreateError && cause.uncertain;
      uncertainRef.current = uncertain;
      setUncertain(uncertain);
      setError(
        recordSaved
          ? actionSaveError(cause)
          : cause instanceof MeetingCreateError
            ? cause.message
            : '회의록을 등록하지 못했어요. 입력 내용을 확인해 주세요.',
      );
      return undefined;
    } finally {
      running.current = false;
      setPending(false);
    }
  };

  return { save, isPending, meetingId, savedActionIndexes, error, isUncertain };
}
