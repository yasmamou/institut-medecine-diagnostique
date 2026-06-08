/* /api/admin/cv?id=... — redirige vers le CV (auth requise).
 * On redirige (302) vers l'URL Blob plutôt que de proxifier le flux : cela
 * évite la limite de taille de réponse des fonctions et gère les CV jusqu'à 20 Mo.
 */
import { list } from "@vercel/blob";
import { isAuthed } from "../../lib/admin.js";

export default async function handler(req, res) {
  if (!isAuthed(req)) return res.status(401).send("Non autorisé.");

  const id = String(req.query.id || "");
  if (!/^[0-9]+-[a-z0-9]+$/.test(id)) return res.status(400).send("Identifiant invalide.");

  try {
    const { blobs } = await list({ prefix: `candidatures/data/${id}.json`, limit: 1 });
    if (!blobs.length) return res.status(404).send("Candidature introuvable.");

    const data = await (await fetch(blobs[0].url, { cache: "no-store" })).json();
    if (!data.cvUrl) return res.status(404).send("CV introuvable.");

    res.setHeader("Location", data.cvUrl);
    return res.status(302).end();
  } catch (err) {
    console.error("[/api/admin/cv]", err);
    return res.status(500).send("Erreur serveur.");
  }
}
