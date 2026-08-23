export interface AuthFormState {
  error: "invalid" | "credentials" | "exists" | "failed" | null;
  /** sign-up succeeded but the project requires email confirmation first */
  confirmEmail: boolean;
}

export const INITIAL_AUTH_STATE: AuthFormState = { error: null, confirmEmail: false };
