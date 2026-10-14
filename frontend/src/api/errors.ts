/** Axios xatosining biz ishlatadigan qismi. */
export interface ApiError {
  message?: string;
  response?: { status?: number; data?: { message?: string; detail?: string } & Record<string, unknown> };
}

export const asApiError = (error: unknown): ApiError => (typeof error === "object" && error !== null ? (error as ApiError) : {});
