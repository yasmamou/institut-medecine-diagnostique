# Institut de Médecine Diagnostique — Landing page

Landing page institutionnelle et sobre destinée à recueillir des candidatures de
professionnels du diagnostic médical (Sud de la France). Site **statique, sans
build**, prêt à déployer.

## Structure

```
.
├── index.html              # Page complète (hero, vision, profils, raisons, formulaire, footer)
├── assets/
│   ├── css/styles.css      # Design system (tokens, composants, responsive, accessibilité)
│   └── js/
│       ├── config.js       # ⚙️ PROJECT_NAME + paramètres CV + mode de soumission
│       ├── form.js         # Validation client + soumission (point de branchement backend)
│       └── main.js         # Injection du nom de projet, année
├── api/
│   └── candidature.js      # Fonction serverless Vercel (backend optionnel)
├── vercel.json             # Config déploiement + en-têtes de sécurité
└── README.md
```

## Personnalisation

- **Nom du projet** : modifier `PROJECT_NAME` dans `assets/js/config.js`.
  Il se propage automatiquement (titre, hero, footer) via `data-project-name`.
- **Taille / type du CV** : `CV_CONFIG` dans `assets/js/config.js`.

## Lancer en local

Le formulaire fonctionne en mode démo (`SIMULATE_SUBMISSION = true`) : aucune
requête réseau, succès simulé. Il suffit d'ouvrir `index.html` dans un navigateur,
ou de servir le dossier :

```bash
python3 -m http.server 8080   # puis http://localhost:8080
```

## Brancher un backend réel

1. Dans `assets/js/config.js`, passez `SIMULATE_SUBMISSION = false`.
2. Ajustez `SUBMIT_ENDPOINT` si besoin (par défaut `/api/candidature`).
3. Complétez `api/candidature.js` : parsing du `multipart/form-data`, stockage du
   CV (Vercel Blob privé, S3…), transmission vers CRM / e-mail / webhook, et
   revalidation serveur. Le point d'envoi côté client est isolé dans la fonction
   `submitApplication()` (`assets/js/form.js`) — facilement remplaçable.

> Les CV ne sont **jamais** stockés en `localStorage`.

## Déploiement

```bash
vercel        # préversion
vercel --prod # production
```

Compatible avec tout hébergeur statique (Netlify, Cloudflare Pages, GitHub Pages…) ;
la route `/api/candidature` nécessite un hébergeur supportant les fonctions
serverless (Vercel).

## Validation du formulaire (côté client)

- Prénom, nom, téléphone, email, profession : requis.
- Email : format vérifié.
- Profession « Autre » : champ texte conditionnel requis.
- CV : **PDF uniquement**, ≤ 20 Mo.
- Consentement : case obligatoire.
- Affichage des erreurs par champ + focus sur la première erreur (accessibilité).
```
