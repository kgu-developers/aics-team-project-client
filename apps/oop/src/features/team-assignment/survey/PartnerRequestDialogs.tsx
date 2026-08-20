import {
  Button,
  Dialog,
  Heading,
  HStack,
  Text,
  VStack,
} from '@aics/design-system';

type PartnerRequestDialogsProps = {
  approveRequestOpen: boolean;
  cancelRequestOpen: boolean;
  isApproving: boolean;
  isCancelling: boolean;
  onApprove: () => void;
  onApproveOpenChange: (isOpen: boolean) => void;
  onCancel: () => void;
  onCancelOpenChange: (isOpen: boolean) => void;
};

export function PartnerRequestDialogs({
  approveRequestOpen,
  cancelRequestOpen,
  isApproving,
  isCancelling,
  onApprove,
  onApproveOpenChange,
  onCancel,
  onCancelOpenChange,
}: PartnerRequestDialogsProps) {
  return (
    <>
      <Dialog
        aria-label='파트너 신청 취소 확인'
        isOpen={cancelRequestOpen}
        onOpenChange={onCancelOpenChange}
        purpose='form'
      >
        <VStack gap={4}>
          <VStack gap={2}>
            <Heading level={2}>파트너 신청을 취소할까요?</Heading>
            <Text color='secondary'>
              취소하면 상대 학생의 받은 신청 목록에서도 사라집니다.
            </Text>
          </VStack>
          <HStack gap={2} justify='end'>
            <Button
              label='돌아가기'
              onClick={() => onCancelOpenChange(false)}
              variant='secondary'
            />
            <Button
              isLoading={isCancelling}
              label='신청 취소'
              onClick={onCancel}
              variant='primary'
            />
          </HStack>
        </VStack>
      </Dialog>
      <Dialog
        aria-label='파트너 확정 확인'
        isOpen={approveRequestOpen}
        onOpenChange={onApproveOpenChange}
        purpose='form'
      >
        <VStack gap={4}>
          <VStack gap={2}>
            <Heading level={2}>파트너를 확정할까요?</Heading>
            <Text color='secondary'>
              파트너가 확정된 뒤에는 변경하거나 취소할 수 없어요.
            </Text>
          </VStack>
          <HStack gap={2} justify='end'>
            <Button
              label='돌아가기'
              onClick={() => onApproveOpenChange(false)}
              variant='secondary'
            />
            <Button
              isLoading={isApproving}
              label='파트너 확정'
              onClick={onApprove}
              variant='primary'
            />
          </HStack>
        </VStack>
      </Dialog>
    </>
  );
}
