/* /api/admin/list — liste les candidatures (auth requise).
 * Renvoie les métadonnées ; le CV se télécharge via /api/admin/cv?id=...
 */
import { list } from "@vercel/blob";
import { isAuthed } from "../../lib/admin.js";

export default async function handler(req, res) {
  if (!isAuthed(req)) return res.status(401).json({ ok: false, error: "Non autorisé." });

  try {
    const { blobs } = await list({ prefix: "candidatures/data/", limit: 1000 });

    const items = await Promise.all(
      blobs.map(async (b) => {
        try {
          const r = await fetch(b.url, { cache: "no-store" });
          const d = await r.json();
          return {
            id: d.id,
            prenom: d.prenom,
            nom: d.nom,
            profession: d.profession,
            telephone: d.telephone,
            email: d.email,
            ville: d.ville,
            cvFilename: d.cvFilename,
            createdAt: d.createdAt,
          };
        } catch {
          return null;
        }
      })
    );

    const result = items
      .filter(Boolean)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

    return res.status(200).json({ ok: true, count: result.length, items: result });
  } catch (err) {
    console.error("[/api/admin/list]", err);
    return res.status(500).json({ ok: false, error: "Erreur serveur." });
  }
}
