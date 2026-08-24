export interface CreateTournamentState {
  error: "invalid" | null;
}

export const INITIAL_CREATE_STATE: CreateTournamentState = { error: null };

export interface EditEventState {
  error: "invalid" | null;
  /** confirmed players the saved change pushed onto the waiting list */
  demoted: number;
}

export const INITIAL_EDIT_STATE: EditEventState = { error: null, demoted: 0 };
