/* /api/admin/login — vérifie le mot de passe et ouvre une session (cookie). */
import { checkPassword, sessionCookie } from "../../lib/admin.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false });
  }
  if (!process.env.ADMIN_PASSWORD) {
    return res.status(500).json({ ok: false, error: "ADMIN_PASSWORD non configuré." });
  }

  const password = (req.body && req.body.password) || "";
  if (!checkPassword(password)) {
    return res.status(401).json({ ok: false, error: "Mot de passe incorrect." });
  }

  // Session de 7 jours
  res.setHeader("Set-Cookie", sessionCookie(process.env.ADMIN_PASSWORD, 7 * 24 * 3600));
  return res.status(200).json({ ok: true });
}
