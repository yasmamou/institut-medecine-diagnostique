/* =============================================================================
 * Formulaire de candidature — validation côté client + soumission
 * -----------------------------------------------------------------------------
 * Validation : email valide, téléphone non vide, PDF uniquement, <= 20 Mo,
 *              consentement obligatoire, champ "Autre" conditionnel.
 *
 * Soumission : voir submitApplication() — point unique à brancher sur un
 *              webhook, un CRM ou une API. Aucun CV n'est stocké en localStorage.
 * ===========================================================================*/

(function () {
  "use strict";

  const { CV_CONFIG, SIMULATE_SUBMISSION, SUBMIT_ENDPOINT } = window.IMD_CONFIG;

  const form = document.getElementById("candidature-form");
  if (!form) return;

  const submitBtn = document.getElementById("submit-btn");
  const successMsg = document.getElementById("form-success");
  const errorMsg = document.getElementById("form-error");

  const professionSelect = document.getElementById("profession");
  const autreField = document.getElementById("profession-autre-field");
  const autreInput = document.getElementById("profession_autre");

  const fileInput = document.getElementById("cv");
  const fileDrop = document.getElementById("file-drop");
  const fileLabel = document.querySelector("[data-file-label]");

  /* ---------- Helpers d'erreur ---------- */
  function fieldOf(input) {
    return input.closest(".field");
  }
  function setError(input, message) {
    const field = fieldOf(input);
    if (!field) return;
    field.classList.add("has-error");
    const el = field.querySelector(`[data-error-for="${input.name || input.id}"]`);
    if (el) el.textContent = message;
    input.setAttribute("aria-invalid", "true");
  }
  function clearError(input) {
    const field = fieldOf(input);
    if (!field) return;
    field.classList.remove("has-error");
    const el = field.querySelector(`[data-error-for="${input.name || input.id}"]`);
    if (el) el.textContent = "";
    input.removeAttribute("aria-invalid");
  }

  /* ---------- Validateurs ---------- */
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function validateRequired(input, message) {
    if (!input.value.trim()) {
      setError(input, message);
      return false;
    }
    clearError(input);
    return true;
  }

  function validateEmail() {
    const input = form.email;
    const value = input.value.trim();
    if (!value) {
      setError(input, "Veuillez indiquer votre email.");
      return false;
    }
    if (!EMAIL_RE.test(value)) {
      setError(input, "Veuillez saisir un email valide.");
      return false;
    }
    clearError(input);
    return true;
  }

  function validatePhone() {
    return validateRequired(form.telephone, "Veuillez indiquer votre téléphone.");
  }

  function validateProfession() {
    const okSelect = validateRequired(professionSelect, "Veuillez sélectionner une profession.");
    if (!okSelect) return false;
    if (professionSelect.value === "Autre") {
      return validateRequired(autreInput, "Veuillez préciser votre profession.");
    }
    return true;
  }

  function validateCv() {
    const file = fileInput.files && fileInput.files[0];
    if (!file) {
      setError(fileInput, "Veuillez joindre votre CV au format PDF.");
      return false;
    }
    const isPdf =
      CV_CONFIG.acceptedMimeTypes.includes(file.type) ||
      file.name.toLowerCase().endsWith(CV_CONFIG.acceptedExtension);
    if (!isPdf) {
      setError(fileInput, "Le fichier doit être au format PDF.");
      return false;
    }
    if (file.size > CV_CONFIG.maxSizeBytes) {
      setError(fileInput, `Le fichier dépasse la taille maximale de ${CV_CONFIG.maxSizeLabel}.`);
      return false;
    }
    clearError(fileInput);
    return true;
  }

  function validateConsent() {
    const input = form.consent;
    if (!input.checked) {
      setError(input, "Vous devez accepter d'être recontacté pour poursuivre.");
      return false;
    }
    clearError(input);
    return true;
  }

  function validateAll() {
    /* On évalue tout (sans court-circuit) pour afficher toutes les erreurs. */
    const checks = [
      validateRequired(form.prenom, "Veuillez indiquer votre prénom."),
      validateRequired(form.nom, "Veuillez indiquer votre nom."),
      validatePhone(),
      validateEmail(),
      validateProfession(),
      validateCv(),
      validateConsent(),
    ];
    return checks.every(Boolean);
  }

  /* ---------- Champ "Autre" conditionnel ---------- */
  professionSelect.addEventListener("change", function () {
    const isAutre = professionSelect.value === "Autre";
    autreField.hidden = !isAutre;
    autreInput.required = isAutre;
    if (!isAutre) {
      autreInput.value = "";
      clearError(autreInput);
    }
    clearError(professionSelect);
  });

  /* ---------- Upload : label + drag & drop ---------- */
  function refreshFileUI() {
    const file = fileInput.files && fileInput.files[0];
    if (file) {
      fileDrop.dataset.state = "filled";
      const sizeMo = (file.size / (1024 * 1024)).toFixed(1);
      fileLabel.textContent = `${file.name} — ${sizeMo} Mo`;
      validateCv();
    } else {
      fileDrop.dataset.state = "empty";
      fileLabel.textContent = "Cliquez ou déposez votre fichier";
    }
  }
  fileInput.addEventListener("change", refreshFileUI);

  ["dragenter", "dragover"].forEach((evt) =>
    fileDrop.addEventListener(evt, (e) => {
      e.preventDefault();
      fileDrop.classList.add("is-dragover");
    })
  );
  ["dragleave", "drop"].forEach((evt) =>
    fileDrop.addEventListener(evt, (e) => {
      e.preventDefault();
      fileDrop.classList.remove("is-dragover");
    })
  );
  fileDrop.addEventListener("drop", (e) => {
    if (e.dataTransfer && e.dataTransfer.files.length) {
      fileInput.files = e.dataTransfer.files;
      refreshFileUI();
    }
  });

  /* Validation à la volée après une première tentative invalide */
  form.addEventListener("input", (e) => {
    const t = e.target;
    if (t.closest(".field.has-error")) {
      if (t === form.email) validateEmail();
      else if (t === fileInput) validateCv();
      else if (t.type === "checkbox") validateConsent();
      else if (t.value.trim()) clearError(t);
    }
  });

  /* ---------------------------------------------------------------------------
   * submitApplication — POINT DE BRANCHEMENT BACKEND
   * ---------------------------------------------------------------------------
   * Reçoit un FormData (champs texte + fichier PDF) prêt à être transmis.
   *
   * >>> POUR BRANCHER UN BACKEND RÉEL :
   *     1. Passez SIMULATE_SUBMISSION = false dans assets/js/config.js
   *     2. Ajustez SUBMIT_ENDPOINT (ex. webhook, route CRM, API).
   *        En déploiement Vercel, /api/candidature pointe vers api/candidature.js,
   *        où vous traiterez/forwarderez la candidature et le CV.
   *
   * Le FormData contient : prenom, nom, telephone, email, profession,
   *   profession_autre (si applicable), ville, consent, cv (fichier PDF).
   *
   * Renvoie une Promise résolue en cas de succès, rejetée en cas d'erreur.
   * -------------------------------------------------------------------------*/
  async function submitApplication(formData) {
    if (SIMULATE_SUBMISSION) {
      // MVP : succès simulé localement, aucune donnée n'est envoyée ni stockée.
      await new Promise((resolve) => setTimeout(resolve, 900));
      return { ok: true };
    }

    const response = await fetch(SUBMIT_ENDPOINT, {
      method: "POST",
      body: formData, // multipart/form-data automatique (ne pas fixer Content-Type)
    });
    if (!response.ok) {
      throw new Error(`Échec de l'envoi (HTTP ${response.status})`);
    }
    return response.json().catch(() => ({ ok: true }));
  }

  /* ---------- Soumission ---------- */
  function setLoading(isLoading) {
    submitBtn.classList.toggle("is-loading", isLoading);
    submitBtn.disabled = isLoading;
    submitBtn.setAttribute("aria-busy", String(isLoading));
  }

  function buildFormData() {
    const fd = new FormData();
    fd.append("prenom", form.prenom.value.trim());
    fd.append("nom", form.nom.value.trim());
    fd.append("telephone", form.telephone.value.trim());
    fd.append("email", form.email.value.trim());
    const profession =
      professionSelect.value === "Autre"
        ? autreInput.value.trim()
        : professionSelect.value;
    fd.append("profession", profession);
    fd.append("profession_categorie", professionSelect.value);
    fd.append("ville", form.ville.value.trim());
    fd.append("consent", form.consent.checked ? "true" : "false");
    fd.append("cv", fileInput.files[0]);
    return fd;
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    successMsg.hidden = true;
    errorMsg.hidden = true;

    if (!validateAll()) {
      // Focus sur le premier champ en erreur (accessibilité).
      const firstError = form.querySelector(".has-error input, .has-error select");
      if (firstError) firstError.focus();
      return;
    }

    setLoading(true);
    try {
      await submitApplication(buildFormData());
      form.reset();
      autreField.hidden = true;
      refreshFileUI();
      successMsg.hidden = false;
      successMsg.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (err) {
      console.error("[Candidature] échec de la soumission :", err);
      errorMsg.hidden = false;
    } finally {
      setLoading(false);
    }
  });
})();
