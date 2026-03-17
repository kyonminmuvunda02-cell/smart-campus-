/**
 * Parses FastAPI error responses into a human-readable string.
 * Handles both simple detail strings and Pydantic validation error arrays.
 */
export function getErrorMessage(err: unknown): string {
  if (typeof err === 'object' && err !== null) {
    const errorObj = err as { body?: { detail?: string | Array<{ msg: string }> }; detail?: string };
    
    // Check for .body.detail (hey-api style)
    if (errorObj.body?.detail) {
      if (typeof errorObj.body.detail === 'string') return errorObj.body.detail;
      if (Array.isArray(errorObj.body.detail)) {
        return errorObj.body.detail.map((d) => d.msg).join(', ');
      }
    }

    // Check for direct .detail (standard FastAPI style)
    if (typeof errorObj.detail === 'string') return errorObj.detail;
  }
  
  if (err instanceof Error) return err.message;
  
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
