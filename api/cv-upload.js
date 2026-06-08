/* =============================================================================
 * /api/cv-upload — génère un jeton d'upload direct navigateur → Vercel Blob
 * -----------------------------------------------------------------------------
 * Le CV (jusqu'à 20 Mo) est envoyé directement du navigateur vers Vercel Blob,
 * ce qui contourne la limite de ~4,5 Mo du corps des fonctions serverless.
 * Ce endpoint ne fait que délivrer un jeton signé et impose les règles :
 * PDF uniquement, 20 Mo maximum.
 *
 * Requiert la variable d'environnement BLOB_READ_WRITE_TOKEN (créée
 * automatiquement lors du provisionnement du store Vercel Blob).
 * ===========================================================================*/

import { handleUpload } from "@vercel/blob/client";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Méthode non autorisée." });
  }

  try {
    const jsonResponse = await handleUpload({
      request: req,
      body: req.body,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ["application/pdf"],
        maximumSizeInBytes: 20 * 1024 * 1024, // 20 Mo
        addRandomSuffix: true, // URL non devinable
      }),
      // onUploadCompleted ne se déclenche pas en local (nécessite HTTPS public).
      // Les métadonnées sont enregistrées séparément via /api/candidature.
      onUploadCompleted: async () => {},
    });
    return res.status(200).json(jsonResponse);
  } catch (err) {
    console.error("[/api/cv-upload]", err);
    return res.status(400).json({ error: err.message || "Upload refusé." });
  }
}
