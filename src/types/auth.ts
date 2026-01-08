export interface Credentials {
  username: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  fusionToken?: string;
  error?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  isDemoMode: boolean;
  user: { username: string } | null;
  fusionToken: string | null;
}

export interface LoginResult {
  success: boolean;
  error?: string;
}

export interface AuthContextValue extends AuthState {
  login: (
    username: string,
    password: string,
    rememberMe: boolean
  ) => Promise<LoginResult>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
}
