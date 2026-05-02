export interface AuthUser {
  id: string;
  name: string;
  role: string;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface BiometricLoginCredentials {
  username: string;
  biometricSample: string;
  deviceId: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
}
