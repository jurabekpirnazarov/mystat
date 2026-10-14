/** Backend javoblarining frontend ishlatadigan qismlari (F-05: `any` o'rniga). */

export interface UserProfile {
  id?: number;
  username: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  phone_number?: string | null;
  birth_date?: string | null;
  created_at?: string;
  date_joined?: string;
  passport_number?: string | null;
  user_type?: "individual" | "legal_entity";
  role?: string;
}

/** Ba'zi endpoint'lar ma'lumotni {data: ...} ichida qaytaradi */
export type MaybeWrapped<T> = T | { data?: T };

export const unwrap = <T,>(payload: MaybeWrapped<T> | null | undefined): T | null => {
  if (payload && typeof payload === "object" && "data" in payload && payload.data) return payload.data as T;
  return (payload as T) ?? null;
};

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthUser {
  name?: string;
  email?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  user_type?: string;
  [key: string]: unknown;
}

export interface AuthPayload {
  success?: boolean;
  tokens?: AuthTokens;
  user?: AuthUser;
  name?: string;
  message?: string;
}

type AuthBody = AuthPayload & Partial<AuthTokens> & AuthUser;

/** login/ va OneID javoblari: {data: {...}} yoki to'g'ridan-to'g'ri */
export type LoginResponse = AuthBody & { data?: AuthBody };
