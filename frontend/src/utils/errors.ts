/**
 * Parses FastAPI error responses into a human-readable string.
 * Handles both simple detail strings and Pydantic validation error arrays.
 */
export function getErrorMessage(err: unknown): string {
  if (typeof err === 'object' && err !== null) {
    const body = (err as { body?: { detail?: string | Array<{ msg: string }> } }).body;

    // Simple string error: { "detail": "Session not found" }
    if (typeof body?.detail === 'string') return body.detail;

    // Pydantic validation errors: { "detail": [{ "msg": "value is not a valid integer" }] }
    if (Array.isArray(body?.detail)) {
      return body.detail.map((d) => d.msg).join(', ');
    }
  }
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Extract HTTP status code from a hey-api error object.
 */
export function getErrorStatus(err: unknown): number | null {
  if (typeof err === 'object' && err !== null) {
    const status = (err as { response?: { status?: number } }).response?.status;
    return status ?? null;
  }
  return null;
}
