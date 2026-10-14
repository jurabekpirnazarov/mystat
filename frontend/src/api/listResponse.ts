/** Backend ro'yxatni ba'zan massiv, ba'zan {results} yoki {data} ko'rinishida qaytaradi. */
export type ListPayload<T> = T[] | { results?: T[]; data?: T[] } | null | undefined;

export function toList<T>(payload: ListPayload<T>): T[] {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.results)) return payload.results;
  if (payload && Array.isArray(payload.data)) return payload.data;
  return [];
}
