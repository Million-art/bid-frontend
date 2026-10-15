/**
 * Matches client-backend `internal/auth.ValidatePasswordPolicy` rules.
 * @returns Error message or null if valid.
 */
export function validatePasswordPolicy(password: string): string | null {
  if (password.length < 4) {
    return "Password must be at least 4 characters.";
  }
  return null;
}
