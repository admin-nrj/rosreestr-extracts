import Long from 'long';

/**
 * Timestamp-like object with seconds and nanos properties
 */
interface TimestampLike {
  seconds: number;
  nanos?: number;
}

/**
 * Type guard to check if value is a Timestamp object
 * Handles both regular numbers and Long objects from protobuf
 */
function isTimestamp(value: unknown): value is TimestampLike {
  if (typeof value !== 'object' || value === null || !('seconds' in value)) {
    return false;
  }

  const seconds = (value as Record<string, unknown>).seconds;

  // Check if seconds is a number
  if (typeof seconds === 'number') {
    return true;
  }

  // Check if seconds is a Long object (from protobuf)
  return typeof seconds === 'object' &&
    seconds !== null &&
    'low' in seconds &&
    'high' in seconds;
}

/**
 * Type guard for the Long object structure: { low: number; high: number; unsigned: boolean }
 */
function isLongObject(value: unknown): value is { low: number; high: number; unsigned: boolean } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'low' in value &&
    'high' in value &&
    'unsigned' in value &&
    typeof value.low === 'number' &&
    typeof value.high === 'number' &&
    typeof value.unsigned === 'boolean'
  );
}

/**
 * Type guard for checking if a value is a plain object (for recursion)
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date);
}

/**
 * Check if a string is a valid ISO 8601 date string
 */
function isISODateString(value: string): boolean {
  // Match ISO 8601 format: YYYY-MM-DDTHH:mm:ss.sssZ or YYYY-MM-DDTHH:mm:ss+HH:mm
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})?$/;
  return isoDateRegex.test(value) && !isNaN(Date.parse(value));
}

/**
 * Convert Timestamp fields (including Long objects from protobuf) to Date objects.
 * Recursively processes the object and converts all Timestamp-like objects to Date.
 * @param obj - The object to convert Timestamp fields from.
 * @returns A new object with Timestamps converted to Dates.
 */
export function convertTimestampsToDate<T, K>(obj: K): T {
  return Object.entries(obj).reduce<Record<string, unknown>>((acc, [key, value]) => {

    if (isTimestamp(value)) {
      const seconds = value.seconds;
      let ms: number; // Milliseconds since epoch

      if (typeof seconds === 'number') {
        ms = seconds * 1000;
      } else if (isLongObject(seconds)) {
        const longSeconds: Long = Long.fromValue(seconds);
        const longMs: Long = longSeconds.multiply(1000);
        ms = longMs.toNumber();
      } else {
        ms = 0;
      }

      acc[key] = new Date(ms + Math.round(value.nanos / 1000000));

    } else if (isPlainObject(value)) {
      acc[key] = convertTimestampsToDate(value as K);
    } else {
      acc[key] = value;
    }

    return acc;
  }, {} as Record<string, unknown>) as T;
}

/**
 * Convert Date fields to Timestamp objects
 * Processes object and converts all Date objects and ISO date strings to Timestamp-like objects
 * @param obj - Object to convert Date fields from
 * @returns New object with Dates converted to Timestamps
 */
export function convertDatesToTimestamp<T, K>(obj: K): T {
  return Object.entries(obj).reduce<Record<string, unknown>>((acc, [key, value]) => {
    if (value instanceof Date) {
      acc[key] = {
        seconds: Math.floor(value.getTime() / 1000),
        nanos: 0,
      };
    } else if (typeof value === 'string' && isISODateString(value)) {
      // Handle ISO date strings from API requests
      const date = new Date(value);
      acc[key] = {
        seconds: Math.floor(date.getTime() / 1000),
        nanos: 0,
      };
    } else {
      acc[key] = value;
    }
    return acc;
  }, {}) as T;
}
