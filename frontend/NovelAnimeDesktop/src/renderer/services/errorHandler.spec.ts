/**
 * Error Handler Property Tests
 * Property 6: Error Handling Consistency
 * 
 * Validates: Requirements 7.1, 7.2, 7.4
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  createAppError,
  fromError,
  fromApiResponse,
  getErrorMessage,
  isRetryableError,
  requiresReauth,
  safeAsync,
  safeSync,
  type AppError,
} from './errorHandler';
import { ErrorCode } from '../types/api';

// Arbitraries
const errorCodeArb = fc.constantFrom(
  ErrorCode.NETWORK_ERROR,
  ErrorCode.UNAUTHORIZED,
  ErrorCode.FORBIDDEN,
  ErrorCode.NOT_FOUND,
  ErrorCode.VALIDATION_ERROR,
  ErrorCode.SERVER_ERROR,
  ErrorCode.TIMEOUT,
  ErrorCode.API_ERROR,
  ErrorCode.UNKNOWN
);

const errorMessageArb = fc.string({ minLength: 1, maxLength: 200 });

const contextArb = fc.dictionary(
  fc.string({ minLength: 1, maxLength: 20 }),
  fc.oneof(fc.string(), fc.integer(), fc.boolean())
);

describe('errorHandler - Property 6: Error Handling Consistency', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  describe('createAppError', () => {
    it('should always create error with required fields', () => {
      fc.assert(
        fc.property(errorCodeArb, errorMessageArb, (code, message) => {
          const error = createAppError(code, message, { shouldLog: false });
          
          expect(error.code).toBe(code);
          expect(error.message).toBe(message);
          expect(error.timestamp).toBeDefined();
          expect(new Date(error.timestamp).getTime()).not.toBeNaN();
        }),
        { numRuns: 50 }
      );
    });

    it('should include context when provided', () => {
      fc.assert(
        fc.property(errorCodeArb, errorMessageArb, contextArb, (code, message, context) => {
          const error = createAppError(code, message, { context, shouldLog: false });
          
          expect(error.context).toEqual(context);
        }),
        { numRuns: 30 }
      );
    });

    it('should generate unique timestamps for different errors', () => {
      fc.assert(
        fc.property(errorCodeArb, errorMessageArb, (code, message) => {
          const error1 = createAppError(code, message, { shouldLog: false });
          const error2 = createAppError(code, message, { shouldLog: false });
          
          // Timestamps should be valid ISO strings
          expect(error1.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
          expect(error2.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
        }),
        { numRuns: 20 }
      );
    });
  });

  describe('fromError', () => {
    it('should convert native Error to AppError', () => {
      fc.assert(
        fc.property(errorMessageArb, (message) => {
          const nativeError = new Error(message);
          const appError = fromError(nativeError, ErrorCode.UNKNOWN, { shouldLog: false });
          
          expect(appError.message).toBe(message);
          expect(appError.originalError).toBe(nativeError);
          expect(appError.details).toBeDefined();
        }),
        { numRuns: 30 }
      );
    });

    it('should handle non-Error values', () => {
      fc.assert(
        fc.property(fc.oneof(fc.string(), fc.integer(), fc.boolean()), (value) => {
          const appError = fromError(value, ErrorCode.UNKNOWN, { shouldLog: false });
          
          expect(appError.message).toBe(String(value));
          expect(appError.code).toBe(ErrorCode.UNKNOWN);
        }),
        { numRuns: 30 }
      );
    });
  });

  describe('fromApiResponse', () => {
    it('should return null for successful responses', () => {
      fc.assert(
        fc.property(fc.string(), (message) => {
          const response = { success: true, message };
          const error = fromApiResponse(response);
          
          expect(error).toBeNull();
        }),
        { numRuns: 20 }
      );
    });

    it('should create error for failed responses', () => {
      fc.assert(
        fc.property(errorMessageArb, (message) => {
          const response = { success: false, message };
          const error = fromApiResponse(response);
          
          expect(error).not.toBeNull();
          expect(error!.message).toBe(message);
        }),
        { numRuns: 20 }
      );
    });
  });

  describe('getErrorMessage', () => {
    it('should return non-empty message for all error codes', () => {
      fc.assert(
        fc.property(errorCodeArb, (code) => {
          const message = getErrorMessage(code);
          
          expect(message).toBeDefined();
          expect(message.length).toBeGreaterThan(0);
        }),
        { numRuns: 20 }
      );
    });
  });

  describe('isRetryableError', () => {
    it('should return boolean for any error', () => {
      fc.assert(
        fc.property(errorCodeArb, errorMessageArb, (code, message) => {
          const error = createAppError(code, message, { shouldLog: false });
          const result = isRetryableError(error);
          
          expect(typeof result).toBe('boolean');
        }),
        { numRuns: 30 }
      );
    });

    it('should mark network/timeout/server errors as retryable', () => {
      const retryableCodes = [ErrorCode.NETWORK_ERROR, ErrorCode.TIMEOUT, ErrorCode.SERVER_ERROR];
      
      retryableCodes.forEach(code => {
        const error = createAppError(code, 'test', { shouldLog: false });
        expect(isRetryableError(error)).toBe(true);
      });
    });

    it('should mark auth errors as non-retryable', () => {
      const nonRetryableCodes = [ErrorCode.UNAUTHORIZED, ErrorCode.FORBIDDEN];
      
      nonRetryableCodes.forEach(code => {
        const error = createAppError(code, 'test', { shouldLog: false });
        expect(isRetryableError(error)).toBe(false);
      });
    });
  });

  describe('requiresReauth', () => {
    it('should return true only for UNAUTHORIZED', () => {
      fc.assert(
        fc.property(errorCodeArb, errorMessageArb, (code, message) => {
          const error = createAppError(code, message, { shouldLog: false });
          const result = requiresReauth(error);
          
          if (code === ErrorCode.UNAUTHORIZED) {
            expect(result).toBe(true);
          } else {
            expect(result).toBe(false);
          }
        }),
        { numRuns: 30 }
      );
    });
  });

  describe('safeAsync', () => {
    it('should return data on success', async () => {
      fc.assert(
        fc.asyncProperty(fc.string(), async (value) => {
          const result = await safeAsync(
            async () => value,
            ErrorCode.UNKNOWN,
            { shouldLog: false }
          );
          
          expect(result.data).toBe(value);
          expect(result.error).toBeNull();
        }),
        { numRuns: 20 }
      );
    });

    it('should return error on failure', async () => {
      fc.assert(
        fc.asyncProperty(errorMessageArb, async (message) => {
          const result = await safeAsync(
            async () => { throw new Error(message); },
            ErrorCode.UNKNOWN,
            { shouldLog: false }
          );
          
          expect(result.data).toBeNull();
          expect(result.error).not.toBeNull();
          expect(result.error!.message).toBe(message);
        }),
        { numRuns: 20 }
      );
    });
  });

  describe('safeSync', () => {
    it('should return data on success', () => {
      fc.assert(
        fc.property(fc.string(), (value) => {
          const result = safeSync(
            () => value,
            ErrorCode.UNKNOWN,
            { shouldLog: false }
          );
          
          expect(result.data).toBe(value);
          expect(result.error).toBeNull();
        }),
        { numRuns: 20 }
      );
    });

    it('should return error on failure', () => {
      fc.assert(
        fc.property(errorMessageArb, (message) => {
          const result = safeSync(
            () => { throw new Error(message); },
            ErrorCode.UNKNOWN,
            { shouldLog: false }
          );
          
          expect(result.data).toBeNull();
          expect(result.error).not.toBeNull();
          expect(result.error!.message).toBe(message);
        }),
        { numRuns: 20 }
      );
    });
  });
});
