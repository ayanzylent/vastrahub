export const PASSWORD_MIN_LENGTH = 3;
export const PASSWORD_MAX_LENGTH = 128;

export const RATE_LIMIT_MESSAGE =
  "Too many attempts. Please wait a few minutes and try again.";

export function validatePassword(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `Password cannot exceed ${PASSWORD_MAX_LENGTH} characters`;
  }
  return null;
}

type AuthErrorLike = {
  message?: string;
  status?: number;
  statusCode?: number;
};

export function getAuthErrorMessage(
  error: AuthErrorLike | null | undefined,
  fallback = "Something went wrong. Please try again.",
): string {
  if (!error) return fallback;

  const status = error.status ?? error.statusCode;
  if (status === 429) return RATE_LIMIT_MESSAGE;

  const message = error.message?.toLowerCase() ?? "";
  if (message.includes("rate limit") || message.includes("too many")) {
    return RATE_LIMIT_MESSAGE;
  }

  return error.message || fallback;
}
