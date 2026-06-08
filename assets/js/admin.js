/* =============================================================================
 * Espace /admin — connexion + affichage des candidatures.
 * ===========================================================================*/

(function () {
  "use strict";

  const loginView = document.getElementById("login-view");
  const dashView = document.getElementById("dash-view");
  const loginForm = document.getElementById("login-form");
  const loginError = document.getElementById("login-error");
  const listState = document.getElementById("list-state");
  const listEl = document.getElementById("cand-list");
  const countPill = document.getElementById("count-pill");

  function show(view) {
    loginView.hidden = view !== "login";
    dashView.hidden = view !== "dash";
  }

  function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );
  }

  function fmtDate(iso) {
    try {
      return new Date(iso).toLocaleString("fr-FR", {
        day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
      });
    } catch {
      return iso || "";
    }
  }

  function render(items) {
    countPill.hidden = false;
    countPill.textContent = items.length + (items.length > 1 ? " candidatures" : " candidature");

    if (!items.length) {
      listState.className = "empty";
      listState.textContent = "Aucune candidature pour le moment.";
      listEl.innerHTML = "";
      return;
    }
    listState.hidden = true;

    listEl.innerHTML = items
      .map((c) => {
        const ville = c.ville ? `<span>📍 ${esc(c.ville)}</span>` : "";
        return `
        <article class="cand-card">
          <div>
            <div class="cand-name">
              ${esc(c.prenom)} ${esc(c.nom)}
              <span class="cand-prof">${esc(c.profession)}</span>
            </div>
            <div class="cand-meta">
              <a href="tel:${esc(c.telephone)}">📞 ${esc(c.telephone)}</a>
              <a href="mailto:${esc(c.email)}">✉️ ${esc(c.email)}</a>
              ${ville}
            </div>
            <div class="cand-date">Reçue le ${esc(fmtDate(c.createdAt))}</div>
          </div>
          <a class="btn btn-primary btn-sm" href="/api/admin/cv?id=${encodeURIComponent(c.id)}" target="_blank" rel="noopener">
            Télécharger le CV
          </a>
        </article>`;
      })
      .join("");
  }

  async function loadList() {
    listState.hidden = false;
    listState.className = "loading";
    listState.textContent = "Chargement…";
    listEl.innerHTML = "";

    const res = await fetch("/api/admin/list", { cache: "no-store" });
    if (res.status === 401) {
      show("login");
      return;
    }
    if (!res.ok) {
      listState.className = "empty";
      listState.textContent = "Erreur de chargement. Réessayez.";
      return;
    }
    const data = await res.json();
    show("dash");
    render(data.items || []);
  }

  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    loginError.textContent = "";
    const password = document.getElementById("password").value;
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      loginForm.reset();
      loadList();
    } else {
      const d = await res.json().catch(() => ({}));
      loginError.textContent = d.error || "Mot de passe incorrect.";
    }
  });

  document.getElementById("refresh-btn").addEventListener("click", loadList);
  document.getElementById("logout-btn").addEventListener("click", function () {
    document.cookie = "imd_admin=; Max-Age=0; Path=/";
    show("login");
  });

  // Au chargement : tente de lister (cookie déjà présent ?) sinon login.
  loadList();
})();
