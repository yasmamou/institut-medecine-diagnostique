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
 * - true  : aucune requête réseau, succès simulé localement (démo hors ligne).
 * - false : envoi réel — upload du CV vers Vercel Blob puis enregistrement.
 *           (Nécessite le déploiement Vercel ; ne fonctionne pas en file://.)
 */
const SIMULATE_SUBMISSION = false;

/* Endpoints backend (déploiement Vercel). */
const SUBMIT_ENDPOINT = "/api/candidature"; // enregistrement des métadonnées
const CV_UPLOAD_ENDPOINT = "/api/cv-upload"; // jeton d'upload direct du CV

/* Version du client Vercel Blob chargée pour l'upload navigateur (doit rester
 * alignée avec la dépendance @vercel/blob de package.json). */
const BLOB_CLIENT_URL = "https://esm.sh/@vercel/blob@2.4.0/client";

/* Exposition globale (le site n'utilise pas de bundler). */
window.IMD_CONFIG = {
  PROJECT_NAME,
  CV_CONFIG,
  SIMULATE_SUBMISSION,
  SUBMIT_ENDPOINT,
  CV_UPLOAD_ENDPOINT,
  BLOB_CLIENT_URL,
};
