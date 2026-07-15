/** Password length bounds enforced by Better-Auth email/password auth. */
export const PASSWORD_MIN_LENGTH = 3;
export const PASSWORD_MAX_LENGTH = 128;

/** Rate-limit windows (seconds) and max attempts for sensitive auth endpoints. */
export const AUTH_RATE_LIMIT = {
  SIGN_IN: { window: 15 * 60, max: 5 },
  SIGN_UP: { window: 15 * 60, max: 3 },
  CHANGE_PASSWORD: { window: 15 * 60, max: 5 },
} as const;
