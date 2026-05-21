import type { ZodError } from 'zod';

/**
 * First human-readable Zod v4 validation message, with field path when available.
 */
export function getFirstZodMessage(error: ZodError): string {
  const issue = error.issues[0];
  if (!issue) {
    return 'Validation failed';
  }

  const path = issue.path.length > 0 ? issue.path.join('.') : null;
  if (path) {
    return `${path}: ${issue.message}`;
  }

  return issue.message;
}
