export type UserRole = 'coach' | 'admin' | 'player' | 'parent';

export type RedirectPath =
  | '/coach'
  | '/admin'
  | '/dashboard'
  | '/unauthorized'
  | '/player'
  | '/parent'
  | '/pending'
  | (string & {});

export interface LoginState {
  error?: string;
}

export type SignupState =
  | { success: false; error: string }
  | { success: true; email: string };

export interface LocationOption {
  id: string;
  name: string;
}

export interface JWTPayload {
  status?: string;
  roles?: string[];
  [key: string]: unknown;
}
