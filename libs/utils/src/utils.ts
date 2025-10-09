export function getErrorName(error: unknown): string {
  if (error instanceof Error) return error.message;

  if (hasStringProperty(error, 'name')) {
    return error.name;
  }

  return 'Unknown error';
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;

  if (hasStringProperty(error, 'message')) {
    return error.message;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return 'Unknown error occurred.';
  }
}

function hasStringProperty<K extends string>(x: unknown, prop: K): x is Record<K, string> {
  return (
    typeof x === 'object' &&
    x !== null &&
    prop in x &&
    typeof (x as Record<string, unknown>)[prop] === 'string'
  );
}
