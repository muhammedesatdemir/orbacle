import {
  isAnswerCategory,
  isLocale,
  type ReadingRequest,
  type ReportRequest,
  type ReportReason,
} from '../types/contract';
import { ApiError } from './errors';

const REPORT_REASONS: ReportReason[] = ['offensive', 'inaccurate', 'harmful', 'other'];

// Parses and validates a reading request body. Throws ApiError(INVALID_INPUT)
// on any problem. `maxQuestion`/`maxWhisper` come from config so limits are tunable.
export function parseReadingRequest(
  body: unknown,
  maxQuestion: number,
  maxWhisper: number,
): ReadingRequest {
  if (typeof body !== 'object' || body === null) {
    throw new ApiError('INVALID_INPUT', { message: 'Body must be a JSON object.' });
  }
  const b = body as Record<string, unknown>;

  const question = typeof b.question === 'string' ? b.question.trim() : '';
  if (!question) {
    throw new ApiError('INVALID_INPUT', { message: 'question is required.' });
  }
  if (question.length > maxQuestion) {
    throw new ApiError('INVALID_INPUT', { message: `question exceeds ${maxQuestion} chars.` });
  }

  const whisper = typeof b.whisper === 'string' ? b.whisper.trim() : '';
  if (whisper.length > maxWhisper) {
    throw new ApiError('INVALID_INPUT', { message: `whisper exceeds ${maxWhisper} chars.` });
  }

  if (!isLocale(b.locale)) {
    throw new ApiError('INVALID_INPUT', { message: 'Unsupported or missing locale.' });
  }

  if (b.category !== undefined && !isAnswerCategory(b.category)) {
    throw new ApiError('INVALID_INPUT', { message: 'Unsupported category.' });
  }

  return {
    question,
    whisper,
    locale: b.locale,
    category: isAnswerCategory(b.category) ? b.category : undefined,
    save: b.save === true,
  };
}

export function parseReportRequest(body: unknown): ReportRequest {
  if (typeof body !== 'object' || body === null) {
    throw new ApiError('INVALID_INPUT', { message: 'Body must be a JSON object.' });
  }
  const b = body as Record<string, unknown>;

  if (typeof b.reason !== 'string' || !REPORT_REASONS.includes(b.reason as ReportReason)) {
    throw new ApiError('INVALID_INPUT', { message: 'Invalid report reason.' });
  }

  const detail = typeof b.detail === 'string' ? b.detail.slice(0, 1000) : undefined;

  return {
    reason: b.reason as ReportReason,
    reading_id: typeof b.reading_id === 'string' ? b.reading_id : undefined,
    detail,
    question: typeof b.question === 'string' ? b.question.slice(0, 1000) : undefined,
    answer: typeof b.answer === 'string' ? b.answer.slice(0, 4000) : undefined,
  };
}

// Install id is a client-generated UUID. Loose check: non-empty, reasonable length.
export function validateInstallId(value: string | undefined | null): string {
  if (!value || typeof value !== 'string' || value.length < 8 || value.length > 128) {
    throw new ApiError('UNAUTHORIZED', { message: 'Missing or invalid X-Install-Id header.' });
  }
  return value;
}
