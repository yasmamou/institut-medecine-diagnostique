/* =============================================================================
 * Helpers partagés pour l'espace /admin (auth par cookie + mot de passe).
 * Le mot de passe est défini par la variable d'environnement ADMIN_PASSWORD.
 * ===========================================================================*/

export const COOKIE_NAME = "imd_admin";

export function parseCookies(req) {
  const header = req.headers.cookie || "";
  const out = {};
  header.split(";").forEach((part) => {
    const i = part.indexOf("=");
    if (i > -1) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  });
  return out;
}

/* Comparaison à temps (à peu près) constant pour éviter le timing attack. */
function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function isAuthed(req) {
  const pwd = process.env.ADMIN_PASSWORD;
  if (!pwd) return false;
  const token = parseCookies(req)[COOKIE_NAME];
  return Boolean(token) && safeEqual(token, pwd);
}

export function checkPassword(value) {
  const pwd = process.env.ADMIN_PASSWORD;
  return Boolean(pwd) && safeEqual(String(value || ""), pwd);
}

export function sessionCookie(value, maxAgeSeconds) {
  return (
    `${COOKIE_NAME}=${encodeURIComponent(value)}; HttpOnly; Secure; ` +
    `SameSite=Strict; Path=/; Max-Age=${maxAgeSeconds}`
  );
}
