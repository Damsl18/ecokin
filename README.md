# EcoKin — Backend corrigé

Backend Node.js/Express + PostgreSQL de la plateforme EcoKin.

## Démarrage rapide

```bash
npm install
cp .env.example .env   # puis remplir les identifiants PostgreSQL
psql -d ecokin -f database/schema.sql
npm run dev
```

Serveur disponible sur `http://localhost:5000`, health check sur :

```http
GET /api/health
```

## Migration si ta base existe déjà

Si tu as déjà créé tes tables, n'exécute pas forcément `schema.sql` directement, sinon tu risques de recréer des tables déjà existantes. Lance plutôt la migration corrective :

```bash
psql -d ecokin -f database/migrations/20260705_fix_statuses_cors_zones.sql
```

Cette migration corrige :

- `articles.statut` : `en_attente`, `publie`, `rejete`.
- `signalements.statut` : `en_attente`, `valide`, `en_cours`, `traite`, `rejete`.
- ajout de la table `zones_risque`.
- index utiles pour la carte et les filtres.

## CORS avec 3 fronts

Dans `.env`, mets par exemple :

```env
FRONTEND_URLS=http://localhost:5501,http://localhost:5502,http://localhost:5503
FRONTEND_PUBLIC_URL=http://localhost:5501
FRONTEND_USER_URL=http://localhost:5502
FRONTEND_ADMIN_URL=http://localhost:5503
FRONTEND_RESET_PASSWORD_PATH=/reset-password.html
```

Le backend accepte encore `FRONTEND_URL` pour compatibilité, mais `FRONTEND_URLS` est plus adapté aux 3 interfaces séparées.

## Statuts acceptés

Le backend accepte aussi les anciennes valeurs envoyées par le front, par exemple `publié`, `rejeté`, `validé`, `traité`, puis les convertit vers des valeurs techniques sans accents avant d'écrire en base.

Valeurs stockées en base :

```text
Articles      : en_attente | publie | rejete
Signalements  : en_attente | valide | en_cours | traite | rejete
Zones risque  : faible | moyen | eleve | critique
```

## Zones à risque

Routes ajoutées :

```http
GET    /api/zones-risque
GET    /api/zones-risque/:id
POST   /api/zones-risque       # admin
PUT    /api/zones-risque/:id   # admin
DELETE /api/zones-risque/:id   # admin
```

`GET /api/map/data` retourne maintenant aussi `zones_risque` en plus de `signalements` et `points_collection`.

## Sécurité contenu articles

Le HTML envoyé dans `contenu` est nettoyé côté backend avant insertion ou modification. Les scripts, iframes, attributs `onclick`, liens `javascript:` et balises dangereuses sont retirés.
