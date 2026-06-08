/* =============================================================================
 * /api/candidature — enregistre une candidature (métadonnées) + notifie par email
 * -----------------------------------------------------------------------------
 * Reçoit du JSON (les champs + l'URL du CV déjà uploadé sur Vercel Blob via
 * /api/cv-upload). Le PDF lui-même ne transite donc PAS par cette fonction.
 *
 * - Stocke les métadonnées dans Vercel Blob : candidatures/data/<id>.json
 * - Envoie un email récapitulatif si RESEND_API_KEY est configurée (optionnel).
 *
 * Variables d'environnement :
 *   BLOB_READ_WRITE_TOKEN  (requis)  — stockage Blob
 *   RESEND_API_KEY         (option.) — active la notification email
 *   NOTIFY_EMAIL           (option.) — destinataire des notifications
 *   RESEND_FROM            (option.) — expéditeur (def. onboarding@resend.dev)
 * ===========================================================================*/

import { put } from "@vercel/blob";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(v, max = 200) {
  return String(v ?? "").trim().slice(0, max);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Méthode non autorisée." });
  }

  try {
    const b = req.body || {};

    const data = {
      prenom: clean(b.prenom, 80),
      nom: clean(b.nom, 80),
      telephone: clean(b.telephone, 40),
      email: clean(b.email, 160),
      profession: clean(b.profession, 120),
      profession_categorie: clean(b.profession_categorie, 120),
      ville: clean(b.ville, 120),
      consent: b.consent === true || b.consent === "true",
      cvUrl: clean(b.cvUrl, 600),
      cvFilename: clean(b.cvFilename, 200),
    };

    // Validation serveur (ne jamais faire confiance au seul client)
    if (!data.prenom || !data.nom || !data.telephone) {
      return res.status(400).json({ ok: false, error: "Champs requis manquants." });
    }
    if (!EMAIL_RE.test(data.email)) {
      return res.status(400).json({ ok: false, error: "Email invalide." });
    }
    if (!data.consent) {
      return res.status(400).json({ ok: false, error: "Consentement requis." });
    }
    if (!/^https:\/\/[^/]*\.public\.blob\.vercel-storage\.com\//.test(data.cvUrl)) {
      return res.status(400).json({ ok: false, error: "CV manquant ou invalide." });
    }

    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const record = { id, ...data, createdAt: new Date().toISOString() };

    // Stockage des métadonnées
    await put(`candidatures/data/${id}.json`, JSON.stringify(record, null, 2), {
      access: "public", // chemin non listable publiquement ; consulté via /admin
      contentType: "application/json",
      addRandomSuffix: false,
    });

    // Notification email (silencieuse si non configurée)
    await notify(record).catch((e) => console.error("[email] échec:", e));

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[/api/candidature]", err);
    return res.status(500).json({ ok: false, error: "Erreur serveur." });
  }
}

async function notify(r) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFY_EMAIL;
  if (!key || !to) return; // email désactivé tant que non configuré

  const { Resend } = await import("resend");
  const resend = new Resend(key);
  const from = process.env.RESEND_FROM || "Institut de Médecine Diagnostique <onboarding@resend.dev>";

  const row = (label, value) =>
    `<tr><td style="padding:6px 14px;color:#5b6b82;font:14px Arial">${label}</td>` +
    `<td style="padding:6px 14px;color:#16243a;font:600 14px Arial">${value || "—"}</td></tr>`;

  await resend.emails.send({
    from,
    to,
    subject: `Nouvelle candidature — ${r.prenom} ${r.nom} (${r.profession})`,
    html: `
      <div style="max-width:560px;margin:auto;font-family:Arial,sans-serif">
        <h2 style="color:#0b1f3a">Nouvelle candidature</h2>
        <table style="border-collapse:collapse;width:100%;border:1px solid #e4e9f1;border-radius:10px;overflow:hidden">
          ${row("Prénom", r.prenom)}
          ${row("Nom", r.nom)}
          ${row("Profession", r.profession)}
          ${row("Téléphone", r.telephone)}
          ${row("Email", r.email)}
          ${row("Ville / région", r.ville)}
          ${row("Reçu le", new Date(r.createdAt).toLocaleString("fr-FR"))}
        </table>
        <p style="margin-top:18px">
          <a href="${r.cvUrl}" style="background:#0b1f3a;color:#fff;padding:11px 18px;border-radius:999px;text-decoration:none;font:600 14px Arial">
            Télécharger le CV (PDF)
          </a>
        </p>
        <p style="color:#8fa0bb;font:12px Arial">Consultez toutes les candidatures sur la page /admin.</p>
      </div>`,
  });
}
