export interface PublicFormState {
  error: "invalid" | "closed" | "full" | "already" | "failed" | null;
}

export const INITIAL_PUBLIC_STATE: PublicFormState = { error: null };
