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
  officerIdOrNrc: string;
  password: string;
}

export interface BiometricLoginCredentials {
  officerIdOrNrc: string;
  biometricSample: string;
  deviceId: string;
}
