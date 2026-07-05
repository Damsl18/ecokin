# EcoKin — Documentation Backend

Backend Node.js / Express / PostgreSQL pour la plateforme EcoKin (gestion
environnementale citoyenne, Kinshasa).

---

## 1. Stack technique

| Élément | Choix |
|---|---|
| Runtime | Node.js ≥ 18 |
| Framework | Express 4 |
| Base de données | PostgreSQL (requêtes SQL brutes via `pg`, pas d'ORM) |
| Authentification | Sessions serveur (token opaque en cookie httpOnly, stocké en BDD) |
| Upload fichiers | Multer (stockage local disque) |
| Hash mots de passe | bcrypt |
| Email (reset password) | Nodemailer (optionnel — voir §5) |
| Déploiement cible | Render.com |

---

## 2. Décisions prises et hypothèses à valider

Ces points ont été tranchés pour permettre de démarrer le backend avant que
le front ne soit disponible. **À reconfirmer** une fois le HTML/CSS/JS en main :

1. **Table `acteurs`** : supprimée du schéma (jugée inutile par l'équipe).
2. **`signalements.titre`** : rendu **nullable**. Le formulaire "Signaler un
   déchet" décrit par l'équipe ne collecte pas de titre explicite — le
   backend en génère un automatiquement à partir des 60 premiers caractères
   de la description si le champ `titre` n'est pas fourni. Si le front
   ajoute finalement un champ titre, il suffit de l'envoyer dans le body.
3. **`articles.categorie`** : conservée mais optionnelle, non décrite dans
   les maquettes fournies. Le front peut l'ignorer pour le MVP.
4. **Sessions** : implémentées "à la main" (token aléatoire de 32 bytes,
   table `sessions`, cookie httpOnly) plutôt qu'avec `express-session` +
   `connect-pg-simple`, pour coller exactement au schéma BDD déjà défini
   par l'équipe.
5. **Mot de passe oublié** : si aucune configuration SMTP n'est fournie
   (`.env`), le lien de réinitialisation est simplement affiché dans les
   logs serveur (mode dev) plutôt que réellement envoyé par email.
6. **Ajouts au schéma `users`** : `is_blocked` (blocage de compte par
   l'admin) et `reset_token` / `reset_token_expires` (mot de passe oublié).
7. **`points_collection`** : CRUD complet réservé à l'admin, lecture
   publique libre (nécessaire pour la carte et le futur back-office admin,
   non détaillé dans les maquettes fournies).

---

## 3. Structure du projet

```
ecokin-backend/
├── server.js                     # Point d'entrée
├── database/
│   └── schema.sql                # Schéma PostgreSQL corrigé
├── src/
│   ├── app.js                    # Config Express (middlewares globaux, routes)
│   ├── config/
│   │   └── db.js                 # Pool de connexion PostgreSQL
│   ├── middlewares/
│   │   ├── auth.js               # requireAuth, requireAdmin
│   │   ├── upload.js             # Multer (photos signalements / couvertures articles)
│   │   └── errorHandler.js       # Gestion centralisée des erreurs
│   ├── models/                   # Requêtes SQL, un fichier par table
│   │   ├── userModel.js
│   │   ├── sessionModel.js
│   │   ├── signalementModel.js
│   │   ├── articleModel.js
│   │   └── pointCollectionModel.js
│   ├── controllers/               # Logique métier / validation
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── signalementController.js
│   │   ├── articleController.js
│   │   ├── pointCollectionController.js
│   │   ├── dashboardController.js
│   │   └── mapController.js
│   ├── routes/                    # Définition des endpoints
│   │   ├── index.js
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── signalementRoutes.js
│   │   ├── articleRoutes.js
│   │   ├── pointCollectionRoutes.js
│   │   ├── dashboardRoutes.js
│   │   └── mapRoutes.js
│   └── utils/
│       └── token.js              # Génération de tokens aléatoires
└── uploads/
    ├── signalements/             # Photos des signalements
    └── articles/                 # Images de couverture des articles
```

---

## 4. Installation et démarrage

```bash
cd ecokin-backend
npm install
cp .env.example .env
# → remplir .env avec les identifiants PostgreSQL locaux

# Créer la base et exécuter le schéma
createdb ecokin
psql -d ecokin -f database/schema.sql

npm run dev   # avec nodemon (dev)
npm start     # production
```

---

## 5. Variables d'environnement (`.env`)

| Variable | Rôle |
|---|---|
| `PORT` | Port du serveur (5000 par défaut) |
| `NODE_ENV` | `development` / `production` (active `secure` cookie en prod) |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Connexion PostgreSQL |
| `FRONTEND_URL` | Origine autorisée en CORS + base des liens dans les emails |
| `SESSION_DURATION_DAYS` | Durée de vie d'une session (7 jours par défaut) |
| `SESSION_COOKIE_NAME` | Nom du cookie de session |
| `SMTP_HOST/PORT/USER/PASSWORD/FROM` | Envoi d'email (mot de passe oublié). Si `SMTP_HOST` vide → lien loggé en console |

---

## 6. Authentification — fonctionnement

- Connexion (`POST /api/auth/login`) : génère un token aléatoire, l'enregistre
  dans `sessions` (avec expiration), le pose en cookie **httpOnly** nommé
  `ecokin_session` (configurable).
- Chaque requête protégée (`requireAuth`) lit ce cookie, vérifie le token en
  base, et attache `req.user = { id, nom, prenom, email, commune, role }`.
- `requireAdmin` (à utiliser après `requireAuth`) bloque l'accès si
  `role !== 'admin'`.
- Déconnexion (`POST /api/auth/logout`) : supprime la ligne en base et
  efface le cookie.
- **Important côté front** : toutes les requêtes `fetch`/`axios` vers l'API
  doivent inclure `credentials: 'include'` pour que le cookie de session
  soit envoyé/reçu (CORS déjà configuré côté serveur pour l'accepter).

---

## 7. Liste complète des endpoints

Légende : 🔓 public · 🔑 utilisateur connecté (`user` ou `admin`) · 🛡️ admin uniquement

### Authentification (`/api/auth`)

| Méthode | Route | Accès | Body |
|---|---|---|---|
| POST | `/register` | 🔓 | `email, password, nom, prenom, commune` |
| POST | `/login` | 🔓 | `email, password` |
| POST | `/logout` | 🔑 | — |
| POST | `/forgot-password` | 🔓 | `email` |
| POST | `/reset-password` | 🔓 | `token, newPassword` |

### Utilisateurs (`/api/users`)

| Méthode | Route | Accès | Body |
|---|---|---|---|
| GET | `/me` | 🔑 | — |
| PUT | `/me` | 🔑 | `nom, prenom, email, commune` |
| PUT | `/me/password` | 🔑 | `currentPassword, newPassword` |
| GET | `/` | 🛡️ | — (liste tous les utilisateurs) |
| GET | `/:id` | 🛡️ | — (détail d'un utilisateur) |
| PATCH | `/:id/block` | 🛡️ | `blocked: true\|false` |
| DELETE | `/:id` | 🛡️ | — |

### Signalements (`/api/signalements`)

| Méthode | Route | Accès | Body / Query |
|---|---|---|---|
| GET | `/public` | 🔓 | Query `?commune=` — signalements visibles pour la carte (`valide`, `en_cours`, `traite`) |
| POST | `/` | 🔑 | multipart/form-data : `description, adresse, latitude, longitude, titre?(auto si absent), photo?(fichier)` |
| GET | `/me` | 🔑 | Query `?statut=en_attente\|valide\|en_cours\|traite\|rejete` |
| GET | `/:id` | 🔑 (propriétaire ou admin) | — |
| GET | `/` | 🛡️ | Query `?statut=&commune=` — tous les signalements |
| PATCH | `/:id/statut` | 🛡️ | `statut, motif_rejet` (requis si `rejete`). Alias acceptés : `validé`, `traité`, `rejeté`. |
| DELETE | `/:id` | 🛡️ | — |

### Articles (`/api/articles`)

| Méthode | Route | Accès | Body / Query |
|---|---|---|---|
| GET | `/public` | 🔓 | Query `?search=&page=&limit=` — articles **publiés**, paginés |
| POST | `/` | 🔑 | multipart/form-data : `titre, contenu, categorie?, cover_image?(fichier)` |
| GET | `/me` | 🔑 | — |
| GET | `/:id` | 🔓 si publié, sinon auteur/admin | — |
| PUT | `/:id` | 🔑 (auteur, si `en_attente`) | `titre, contenu, categorie?, cover_image?` |
| DELETE | `/:id` | 🔑 (auteur si `en_attente`) ou 🛡️ | — |
| GET | `/` | 🛡️ | Query `?statut=` |
| PATCH | `/:id/statut` | 🛡️ | `statut: publie\|rejete\|en_attente`. Alias acceptés : `publié`, `rejeté`. |

### Points de collecte (`/api/points-collection`)

| Méthode | Route | Accès | Body |
|---|---|---|---|
| GET | `/` | 🔓 | Query `?type_dechet=` |
| GET | `/:id` | 🔓 | — |
| POST | `/` | 🛡️ | `nom, adresse, latitude, longitude, type_dechet?, horaires?, contact?` |
| PUT | `/:id` | 🛡️ | idem |
| DELETE | `/:id` | 🛡️ | — |


### Zones à risque (`/api/zones-risque`)

| Méthode | Route | Accès | Body / Query |
|---|---|---|---|
| GET | `/` | 🔓 | Query `?commune=&niveau_risque=` |
| GET | `/:id` | 🔓 | — |
| POST | `/` | 🛡️ | `nom, latitude, longitude, description?, commune?, niveau_risque?, rayon_m?` |
| PUT | `/:id` | 🛡️ | idem |
| DELETE | `/:id` | 🛡️ | — |

Niveaux acceptés : `faible`, `moyen`, `eleve`, `critique`.

### Carte (`/api/map`)

| Méthode | Route | Accès | Description |
|---|---|---|---|
| GET | `/data` | 🔓 | Query `?commune=&type_dechet=&niveau_risque=` — retourne `{ signalements: [...], points_collection: [...], zones_risque: [...] }`, coordonnées déjà en `float`, prêtes pour Leaflet |

### Tableaux de bord & stats

| Méthode | Route | Accès | Description |
|---|---|---|---|
| GET | `/api/dashboard/user` | 🔑 | Widgets espace utilisateur (voir §8) |
| GET | `/api/dashboard/admin` | 🛡️ | Widgets espace admin |
| GET | `/api/stats/public` | 🔓 | Stats page d'accueil (citoyens inscrits, signalements traités, articles publiés) |

---

## 8. Détail des réponses "widgets" (dashboards)

**`GET /api/dashboard/user`**
```json
{
  "widgets": {
    "nombre_signalements": 5,
    "nombre_articles": 2,
    "articles_publies": 1,
    "signalements_traites": 3
  },
  "derniers_signalements": [ /* 5 derniers signalements de l'utilisateur */ ]
}
```

**`GET /api/dashboard/admin`**
```json
{
  "widgets": {
    "total_utilisateurs": 120,
    "total_signalements": 340,
    "total_articles": 58,
    "signalements_en_attente": 12,
    "articles_en_attente": 4
  }
}
```

---

## 9. Champs de formulaires attendus par le backend

Pour que l'intégration front soit directe une fois les maquettes récupérées :

**Inscription** — `nom, prenom, email, password, commune` (tous obligatoires,
password ≥ 6 caractères)

**Connexion** — `email, password`

**Mot de passe oublié** — `email`

**Réinitialisation** — `token` (reçu par email/lien), `newPassword`

**Signaler un déchet** — `description` (obligatoire), `adresse` (obligatoire),
`latitude` + `longitude` (obligatoires, remplis automatiquement au clic sur
la carte), `photo` (optionnel, fichier), `titre` (optionnel — généré
automatiquement sinon)

**Écrire un article** — `titre` (obligatoire), `contenu` (obligatoire),
`categorie` (optionnel), `cover_image` (optionnel, fichier)

**Profil** — `nom, prenom, email, commune` (modification) ;
`currentPassword, newPassword` (changement de mot de passe)

**Point de collecte (admin)** — `nom, adresse, latitude, longitude`
(obligatoires), `type_dechet, horaires, contact` (optionnels)

---

## 10. Upload d'images

- Formats acceptés : JPG, PNG, WEBP — taille max **5 Mo**.
- Stockage local : `uploads/signalements/` et `uploads/articles/`, noms de
  fichiers générés aléatoirement (pas de collision).
- Seul le **chemin relatif** est stocké en BDD (`photo_path`,
  `cover_image_path`), ex. `/uploads/signalements/ab12cd34.jpg`.
- Ces fichiers sont servis statiquement sur `/uploads/...` — le front peut
  donc les afficher directement en préfixant avec l'URL du backend.

---

## 11. Points d'attention pour la suite

- **CORS** : `credentials: true` est activé côté serveur ; le front doit
  systématiquement envoyer `credentials: 'include'` dans ses requêtes.
- **Nettoyage des sessions expirées** : `SessionModel.deleteExpired()` existe
  mais n'est appelée nulle part automatiquement pour l'instant — à brancher
  sur un cron (ex. `node-cron`) ou à exécuter périodiquement en prod.
- **Validation** : actuellement manuelle dans les contrôleurs (pas de
  librairie type `express-validator` ou `joi`) — suffisant pour le MVP mais
  à muscler si le temps le permet.
- **Rôle admin** : aucune route ne permet de créer un admin via l'API (comme
  prévu — "compte dédié créé manuellement", F1). Il faudra un script ou une
  requête SQL manuelle pour créer le premier compte admin, ex. :
  ```sql
  UPDATE users SET role = 'admin' WHERE email = 'admin@ecokin.cd';
  ```
