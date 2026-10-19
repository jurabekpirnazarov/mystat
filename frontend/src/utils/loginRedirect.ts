// Mehmon login talab qiladigan amalni bossa — kirgandan keyin o'sha sahifaga qaytariladi.
// Manzil `?next=` da yuriladi, OneID orqali tashqi saytga chiqib qaytish uchun sessionStorage'da ham saqlanadi.

const KEY = "login:return-to";

/** Faqat sayt ichidagi yo'l: "/..." bilan boshlanadi, "//host" emas, login sahifasining o'zi emas. */
export function safeReturnPath(path: string | null | undefined): string | null {
  if (!path || !path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) return null;
  if (path === "/login" || path.startsWith("/login?") || path.startsWith("/auth/")) return null;
  return path;
}

export function currentPath(): string {
  return window.location.pathname + window.location.search + window.location.hash;
}

export function loginUrl(from: string = currentPath()): string {
  const next = safeReturnPath(from);
  return next ? `/login?next=${encodeURIComponent(next)}` : "/login";
}

export function rememberReturnTo(path: string | null | undefined): void {
  const next = safeReturnPath(path);
  if (!next) return;
  try {
    sessionStorage.setItem(KEY, next);
  } catch {
    /* sessionStorage yopiq bo'lsa — qaytishsiz davom etamiz */
  }
}

/** Saqlangan manzilni o'qiydi va o'chiradi. */
export function takeReturnTo(): string | null {
  try {
    const next = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    return safeReturnPath(next);
  } catch {
    return null;
  }
}

/** 401 bo'lganda: joriy sahifani `?next=` bilan login'ga yuboradi. */
export function redirectToLogin(): void {
  if (window.location.pathname === "/login") return;
  window.location.href = loginUrl();
}
