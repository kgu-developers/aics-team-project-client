import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import type {
  SubmitMidReportFeedbackInput,
  SubmitProposalFeedbackResponseInput,
} from '@aics/core';
import { http, HttpResponse } from 'msw';

import { requireStudent } from './studentGuard';
import { hasResubmittedMidReportRevision } from '../data/midReport';
import { hasResubmittedProposalRevision } from '../data/proposal';
import {
  createMidReportFeedback,
  createProposalFeedbackResponse,
  demoFeedbackTeamId,
  demoMidReportSubmissionId,
  demoProposalReviewId,
  getMidReportFeedback,
  getProposalFeedbackResponse,
} from '../data/studentFeedback';
import { getDemoStudentAccount } from '../data/users';

function error(code: string, message: string, status: number) {
  return HttpResponse.json({ code, message }, { status });
}

function getStudentTeam(request: Request, resourceLabel: string) {
  const student = requireStudent(request, resourceLabel);
  if ('response' in student) return student;

  const accessToken =
    request.headers.get('authorization')?.replace('Bearer ', '') ?? null;
  const account = getDemoStudentAccount(accessToken);
  const team = account?.user.currentTeam;
  if (!team || team.id !== demoFeedbackTeamId) {
    return {
      response: error(
        'TEAM_ACCESS_DENIED',
        '현재 팀의 피드백만 작성할 수 있어요.',
        403,
      ),
    };
  }

  return { name: student.name, teamId: team.id };
}

export const studentFeedbackHandlers = [
  http.post(
    `${API_BASE_URL}${ENDPOINTS.REVIEW.REVISION_RESPONSE(':reviewId')}`,
    async ({ params, request }) => {
      const student = getStudentTeam(request, '제안서 피드백');
      if ('response' in student) return student.response;
      if (params.reviewId !== demoProposalReviewId) {
        return error(
          'PROPOSAL_REVIEW_NOT_FOUND',
          '제안서 피드백을 찾을 수 없어요.',
          404,
        );
      }
      if (getProposalFeedbackResponse(student.teamId)) {
        return error(
          'PROPOSAL_FEEDBACK_RESPONSE_ALREADY_SUBMITTED',
          '이미 피드백 반영 답변을 제출했어요.',
          409,
        );
      }

      let input: SubmitProposalFeedbackResponseInput;
      try {
        input = (await request.json()) as SubmitProposalFeedbackResponseInput;
      } catch {
        return error(
          'INVALID_REQUEST',
          '피드백 반영 답변 형식이 올바르지 않아요.',
          400,
        );
      }
      if (typeof input?.content !== 'string' || !input.content.trim()) {
        return error(
          'PROPOSAL_FEEDBACK_RESPONSE_REQUIRED',
          '피드백 반영 내용을 입력해 주세요.',
          422,
        );
      }
      if (!hasResubmittedProposalRevision()) {
        return error(
          'PROPOSAL_REVISION_RESUBMISSION_REQUIRED',
          '제안서를 수정해 다시 제출한 뒤 반영 답변을 남겨 주세요.',
          409,
        );
      }

      const response = createProposalFeedbackResponse(
        student.teamId,
        student.name,
        input,
      );
      if (!response) {
        return error(
          'PROPOSAL_FEEDBACK_RESPONSE_ALREADY_SUBMITTED',
          '이미 피드백 반영 답변을 제출했어요.',
          409,
        );
      }
      return HttpResponse.json(response, { status: 201 });
    },
  ),
  http.post(
    `${API_BASE_URL}${ENDPOINTS.SUBMISSION.MID_REPORT_FEEDBACK(':submissionId')}`,
    async ({ params, request }) => {
      const student = getStudentTeam(request, '중간보고서 피드백');
      if ('response' in student) return student.response;
      if (params.submissionId !== demoMidReportSubmissionId) {
        return error(
          'MID_REPORT_SUBMISSION_NOT_FOUND',
          '중간보고서 제출을 찾을 수 없어요.',
          404,
        );
      }
      if (getMidReportFeedback(student.teamId)) {
        return error(
          'MID_REPORT_FEEDBACK_ALREADY_SUBMITTED',
          '이미 대면 피드백 반영 내용을 제출했어요.',
          409,
        );
      }

      let input: SubmitMidReportFeedbackInput;
      try {
        input = (await request.json()) as SubmitMidReportFeedbackInput;
      } catch {
        return error(
          'INVALID_REQUEST',
          '대면 피드백 반영 내용 형식이 올바르지 않아요.',
          400,
        );
      }
      if (typeof input?.content !== 'string' || !input.content.trim()) {
        return error(
          'MID_REPORT_FEEDBACK_REQUIRED',
          '대면 피드백과 반영 내용을 입력해 주세요.',
          422,
        );
      }
      if (!hasResubmittedMidReportRevision()) {
        return error(
          'MID_REPORT_REVISION_RESUBMISSION_REQUIRED',
          '중간보고서를 수정해 다시 제출한 뒤 반영 내용을 남겨 주세요.',
          409,
        );
      }

      const feedback = createMidReportFeedback(
        student.teamId,
        student.name,
        input,
      );
      if (!feedback) {
        return error(
          'MID_REPORT_FEEDBACK_ALREADY_SUBMITTED',
          '이미 대면 피드백 반영 내용을 제출했어요.',
          409,
        );
      }
      return HttpResponse.json(feedback, { status: 201 });
    },
  ),
];
