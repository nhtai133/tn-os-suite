export interface SessionPayload {
  email: string;
  role: "owner";
}

export interface AuthResult {
  success: boolean;
  error?: string;
}
