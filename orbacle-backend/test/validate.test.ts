import { describe, it, expect } from 'vitest';
import { parseReadingRequest, parseReportRequest, validateInstallId } from '../src/lib/validate';
import { ApiError } from '../src/lib/errors';

const MAXQ = 200;
const MAXW = 120;

describe('parseReadingRequest', () => {
  it('accepts a valid request', () => {
    const r = parseReadingRequest(
      { question: 'Should I?', whisper: 'A waiting heart.', locale: 'en', category: 'love' },
      MAXQ,
      MAXW,
    );
    expect(r.question).toBe('Should I?');
    expect(r.locale).toBe('en');
    expect(r.category).toBe('love');
    expect(r.save).toBe(false);
  });

  it('rejects empty question with INVALID_INPUT', () => {
    expect(() => parseReadingRequest({ question: '   ', locale: 'en', whisper: '' }, MAXQ, MAXW))
      .toThrowError(ApiError);
    try {
      parseReadingRequest({ question: '', locale: 'en', whisper: '' }, MAXQ, MAXW);
    } catch (e) {
      expect((e as ApiError).code).toBe('INVALID_INPUT');
    }
  });

  it('rejects unsupported locale', () => {
    try {
      parseReadingRequest({ question: 'q', locale: 'xx', whisper: '' }, MAXQ, MAXW);
      throw new Error('should have thrown');
    } catch (e) {
      expect((e as ApiError).code).toBe('INVALID_INPUT');
    }
  });

  it('rejects unsupported category', () => {
    try {
      parseReadingRequest({ question: 'q', locale: 'en', whisper: '', category: 'nope' }, MAXQ, MAXW);
      throw new Error('should have thrown');
    } catch (e) {
      expect((e as ApiError).code).toBe('INVALID_INPUT');
    }
  });

  it('rejects an over-long question', () => {
    const long = 'a'.repeat(MAXQ + 1);
    try {
      parseReadingRequest({ question: long, locale: 'en', whisper: '' }, MAXQ, MAXW);
      throw new Error('should have thrown');
    } catch (e) {
      expect((e as ApiError).code).toBe('INVALID_INPUT');
    }
  });
});

describe('parseReportRequest', () => {
  it('accepts a valid reason', () => {
    expect(parseReportRequest({ reason: 'harmful' }).reason).toBe('harmful');
  });
  it('rejects an invalid reason', () => {
    expect(() => parseReportRequest({ reason: 'spam' })).toThrowError(ApiError);
  });
});

describe('validateInstallId', () => {
  it('accepts a UUID', () => {
    expect(validateInstallId('11111111-1111-1111-1111-111111111111')).toBeTruthy();
  });
  it('rejects missing id with UNAUTHORIZED', () => {
    try {
      validateInstallId(undefined);
      throw new Error('should have thrown');
    } catch (e) {
      expect((e as ApiError).code).toBe('UNAUTHORIZED');
    }
  });
});
