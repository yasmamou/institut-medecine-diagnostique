/* =============================================================================
 * Configuration globale du projet
 * -----------------------------------------------------------------------------
 * Le nom du projet est centralisé ici. Modifiez PROJECT_NAME pour le répercuter
 * sur l'ensemble de la page (titre, hero, footer, métadonnées).
 * ===========================================================================*/

const PROJECT_NAME = "Institut de Médecine Diagnostique";

/* Paramètres d'upload du CV */
const CV_CONFIG = {
  acceptedMimeTypes: ["application/pdf"],
  acceptedExtension: ".pdf",
  maxSizeBytes: 20 * 1024 * 1024, // 20 Mo
  maxSizeLabel: "20 Mo",
};

/* Mode de soumission.
 * - true  : aucune requête réseau, succès simulé localement (MVP / démo).
 * - false : envoi réel vers SUBMIT_ENDPOINT (voir assets/js/form.js).
 */
const SIMULATE_SUBMISSION = true;

/* Endpoint backend utilisé lorsque SIMULATE_SUBMISSION = false.
 * En déploiement Vercel, /api/candidature pointe vers api/candidature.js.
 */
const SUBMIT_ENDPOINT = "/api/candidature";

/* Exposition globale (le site n'utilise pas de bundler). */
window.IMD_CONFIG = {
  PROJECT_NAME,
  CV_CONFIG,
  SIMULATE_SUBMISSION,
  SUBMIT_ENDPOINT,
};
