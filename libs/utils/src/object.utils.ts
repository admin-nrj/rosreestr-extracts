/**
 * Remove undefined and null fields from object
 * Returns a new object without undefined or null values
 * @param obj - Object to remove undefined/null fields from
 * @returns New object without undefined/null fields
 */
export function removeUndefinedFields<T>(obj: Record<string, unknown>): T {
  return Object.entries(obj).reduce<Record<string, unknown>>((acc, [key, value]) => {
    if (value !== undefined && value !== null) {
      acc[key] = value;
    }
    return acc;
  }, {}) as T;
}
