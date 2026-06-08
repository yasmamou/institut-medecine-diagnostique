/* =============================================================================
 * Fonction serverless — réception des candidatures (point de branchement backend)
 * -----------------------------------------------------------------------------
 * Déployée automatiquement par Vercel sur la route /api/candidature.
 * Le frontend (assets/js/form.js) y envoie un multipart/form-data contenant les
 * champs texte + le CV (PDF) lorsque SIMULATE_SUBMISSION = false.
 *
 * Cet exemple est volontairement minimal : il accuse réception de la requête.
 *
 * >>> À COMPLÉTER SELON VOTRE BACKEND :
 *     - Parsing du multipart (ex. busboy / formidable) pour extraire le fichier.
 *     - Enregistrement du CV (Vercel Blob, S3, GCS…) — ne jamais le logger.
 *     - Forward vers un CRM / une boîte mail / un webhook.
 *     - Validation serveur (taille <= 20 Mo, type PDF, champs requis).
 *     - Anti-spam (rate limiting, Vercel BotID…).
 *
 * Réponses : 200 { ok: true } en succès, 4xx/5xx sinon (le frontend affiche
 * alors le message d'erreur générique).
 * ===========================================================================*/

export const config = {
  api: {
    bodyParser: false, // requis pour recevoir un upload multipart brut
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Méthode non autorisée." });
  }

  try {
    // TODO: parser le multipart/form-data, persister le CV et transmettre la
    //       candidature vers votre destination (CRM, e-mail, webhook…).
    //
    //       Exemple d'intégration (pseudo-code) :
    //         const { fields, file } = await parseMultipart(req);
    //         await storeCv(file);                  // ex. Vercel Blob (privé)
    //         await notifyTeam(fields);             // ex. e-mail / Slack / CRM
    //
    //       Pensez à revalider côté serveur : PDF, taille <= 20 Mo, champs requis.

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[/api/candidature] erreur :", err);
    return res.status(500).json({ ok: false, error: "Erreur serveur." });
  }
}
