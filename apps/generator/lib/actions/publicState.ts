export interface PublicFormState {
  error: "invalid" | "level" | "closed" | "full" | "already" | "guestLimit" | "failed" | null;
}

export const INITIAL_PUBLIC_STATE: PublicFormState = { error: null };
