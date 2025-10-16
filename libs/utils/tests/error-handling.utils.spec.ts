/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { getErrorMessage } from '../src/error-handling.utils';

describe('getErrorMessage', () => {
  describe('when error is an instance of Error', () => {
    it('should return error message from Error instance', () => {
      const error = new Error('Test error message');
      const result = getErrorMessage(error);
      expect(result).toBe('Test error message');
    });

    it('should handle Error with empty message', () => {
      const error = new Error('');
      const result = getErrorMessage(error);
      expect(result).toBe('');
    });

    it('should handle Error with special characters in message', () => {
      const error = new Error('Error: Invalid input! @#$%^&*()');
      const result = getErrorMessage(error);
      expect(result).toBe('Error: Invalid input! @#$%^&*()');
    });

    it('should handle Error with multiline message', () => {
      const error = new Error('Line 1\nLine 2\nLine 3');
      const result = getErrorMessage(error);
      expect(result).toBe('Line 1\nLine 2\nLine 3');
    });
  });

  describe('when error is a string', () => {
    it('should return the string as-is', () => {
      const error = 'Simple error string';
      const result = getErrorMessage(error);
      expect(result).toBe('Simple error string');
    });

    it('should handle empty string', () => {
      const error = '';
      const result = getErrorMessage(error);
      expect(result).toBe('');
    });

    it('should handle string with special characters', () => {
      const error = 'Error: @#$%^&*()';
      const result = getErrorMessage(error);
      expect(result).toBe('Error: @#$%^&*()');
    });

    it('should handle multiline string', () => {
      const error = 'Line 1\nLine 2\nLine 3';
      const result = getErrorMessage(error);
      expect(result).toBe('Line 1\nLine 2\nLine 3');
    });
  });

  describe('when error is an object with message property', () => {
    it('should return message property from object', () => {
      const error = { message: 'Object error message' };
      const result = getErrorMessage(error);
      expect(result).toBe('Object error message');
    });

    it('should handle object with message and other properties', () => {
      const error = {
        message: 'Error occurred',
        code: 500,
        timestamp: Date.now(),
      };
      const result = getErrorMessage(error);
      expect(result).toBe('Error occurred');
    });

    it('should handle object with empty message', () => {
      const error = { message: '' };
      const result = getErrorMessage(error);
      expect(result).toBe('');
    });

    it('should handle nested object with message', () => {
      const error = {
        message: 'Nested error',
        nested: { data: 'some data' },
      };
      const result = getErrorMessage(error);
      expect(result).toBe('Nested error');
    });
  });

  describe('when error is an object without message property', () => {
    it('should return JSON.stringify for object without message', () => {
      const error = { code: 404, status: 'Not Found' };
      const result = getErrorMessage(error);
      expect(result).toBe(JSON.stringify(error));
    });

    it('should handle empty object', () => {
      const error = {};
      const result = getErrorMessage(error);
      expect(result).toBe('{}');
    });

    it('should handle object with complex nested structure', () => {
      const error = {
        code: 500,
        details: {
          nested: {
            deep: 'value',
          },
        },
      };
      const result = getErrorMessage(error);
      expect(result).toBe(JSON.stringify(error));
    });

    it('should handle object with array properties', () => {
      const error = {
        errors: ['error1', 'error2', 'error3'],
        status: 'failed',
      };
      const result = getErrorMessage(error);
      expect(result).toBe(JSON.stringify(error));
    });
  });

  describe('when error has non-string message property', () => {
    it('should stringify object with numeric message', () => {
      const error = { message: 123 };
      const result = getErrorMessage(error);
      expect(result).toBe(JSON.stringify(error));
    });

    it('should stringify object with boolean message', () => {
      const error = { message: true };
      const result = getErrorMessage(error);
      expect(result).toBe(JSON.stringify(error));
    });

    it('should stringify object with null message', () => {
      const error = { message: null };
      const result = getErrorMessage(error);
      expect(result).toBe(JSON.stringify(error));
    });

    it('should stringify object with undefined message', () => {
      const error = { message: undefined };
      const result = getErrorMessage(error);
      expect(result).toBe(JSON.stringify(error));
    });

    it('should stringify object with object message', () => {
      const error = { message: { nested: 'value' } };
      const result = getErrorMessage(error);
      expect(result).toBe(JSON.stringify(error));
    });
  });

  describe('when error is a primitive value', () => {
    it('should stringify number', () => {
      const error = 404;
      const result = getErrorMessage(error);
      expect(result).toBe('404');
    });

    it('should stringify boolean true', () => {
      const error = true;
      const result = getErrorMessage(error);
      expect(result).toBe('true');
    });

    it('should stringify boolean false', () => {
      const error = false;
      const result = getErrorMessage(error);
      expect(result).toBe('false');
    });

    it('should handle null', () => {
      const error = null;
      const result = getErrorMessage(error);
      expect(result).toBe('null');
    });

    it('should handle undefined', () => {
      const error = undefined;
      const result = getErrorMessage(error);
      expect(result).toBeUndefined();
    });
  });

  describe('when error is a circular reference', () => {
    it('should return message property if it exists even with circular reference', () => {
      const error: any = { message: 'circular' };
      error.self = error; // Create circular reference

      const result = getErrorMessage(error);
      // Function checks for message property first before trying to stringify
      expect(result).toBe('circular');
    });

    it('should return fallback message for complex circular reference', () => {
      const error: any = {
        data: { nested: {} },
      };
      error.data.nested.parent = error; // Create circular reference

      const result = getErrorMessage(error);
      expect(result).toBe('Unknown error occurred.');
    });
  });

  describe('when error is an array', () => {
    it('should stringify array of strings', () => {
      const error = ['error1', 'error2', 'error3'];
      const result = getErrorMessage(error);
      expect(result).toBe(JSON.stringify(error));
    });

    it('should stringify empty array', () => {
      const error: any[] = [];
      const result = getErrorMessage(error);
      expect(result).toBe('[]');
    });

    it('should stringify array of objects', () => {
      const error = [{ code: 1 }, { code: 2 }];
      const result = getErrorMessage(error);
      expect(result).toBe(JSON.stringify(error));
    });
  });

  describe('when error is a custom Error subclass', () => {
    class CustomError extends Error {
      constructor(
        message: string,
        public code: number
      ) {
        super(message);
        this.name = 'CustomError';
      }
    }

    it('should return message from custom Error subclass', () => {
      const error = new CustomError('Custom error occurred', 500);
      const result = getErrorMessage(error);
      expect(result).toBe('Custom error occurred');
    });

    it('should prioritize Error.message over object properties', () => {
      const error = new CustomError('Error message', 404);
      const result = getErrorMessage(error);
      expect(result).toBe('Error message');
    });
  });

  describe('edge cases', () => {
    it('should handle Symbol', () => {
      const error = Symbol('test');
      const result = getErrorMessage(error);
      // Symbol cannot be converted to string by JSON.stringify
      expect(result).toBeUndefined();
    });

    it('should handle BigInt', () => {
      const error = BigInt(12345);
      const result = getErrorMessage(error);
      // BigInt cannot be serialized to JSON, so it falls back to catch block
      expect(result).toBe('Unknown error occurred.');
    });

    it('should handle function', () => {
      const error = function testFunc() {
        return 'test';
      };
      const result = getErrorMessage(error);
      // Functions cannot have string properties and cannot be stringified
      expect(result).toBeUndefined();
    });

    it('should handle Date object', () => {
      const error = new Date('2024-01-01');
      const result = getErrorMessage(error);
      expect(result).toBe(JSON.stringify(error));
    });

    it('should handle RegExp', () => {
      const error = /test/g;
      const result = getErrorMessage(error);
      expect(result).toBe('{}');
    });

    it('should handle Error-like object with message', () => {
      const error = {
        name: 'CustomError',
        message: 'Error-like message',
        stack: 'some stack trace',
      };
      const result = getErrorMessage(error);
      expect(result).toBe('Error-like message');
    });
  });
});
