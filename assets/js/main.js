/* =============================================================================
 * Interactions générales de la page
 * - Injection du nom de projet (PROJECT_NAME) sur tous les emplacements.
 * - Année courante dans le footer.
 * ===========================================================================*/

(function () {
  "use strict";

  const { PROJECT_NAME } = window.IMD_CONFIG;

  // Propage le nom de projet partout où data-project-name est présent.
  document.querySelectorAll("[data-project-name]").forEach((el) => {
    el.textContent = PROJECT_NAME;
  });

  // Année courante (footer).
  document.querySelectorAll("[data-current-year]").forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });
})();
