# Correctifs appliqués au backend EcoKin

## 1. Statuts articles corrigés

Le backend stocke maintenant les statuts techniques sans accents :

- `en_attente`
- `publie`
- `rejete`

Le backend accepte encore les anciens alias envoyés par le front : `publié`, `rejeté`, etc. Ils sont automatiquement convertis avant insertion en base.

## 2. Workflow des signalements complété

Statuts disponibles :

- `en_attente`
- `valide`
- `en_cours`
- `traite`
- `rejete`

Alias acceptés : `validé`, `traité`, `rejeté`, `en cours`.

## 3. Migration SQL ajoutée

Fichier :

```text
database/migrations/20260705_fix_statuses_cors_zones.sql
```

Commande :

```bash
psql -d ecokin -f database/migrations/20260705_fix_statuses_cors_zones.sql
```

## 4. Zones à risque ajoutées

Nouvelle table : `zones_risque`.

Nouvelles routes :

```http
GET    /api/zones-risque
GET    /api/zones-risque/:id
POST   /api/zones-risque       # admin
PUT    /api/zones-risque/:id   # admin
DELETE /api/zones-risque/:id   # admin
```

`GET /api/map/data` retourne maintenant aussi `zones_risque`.

## 5. CORS multi-fronts

Le backend accepte maintenant plusieurs origines :

```env
FRONTEND_URLS=http://localhost:5501,http://localhost:5502,http://localhost:5503
```

## 6. Reset password corrigé

Le lien pointe maintenant vers :

```env
FRONTEND_RESET_PASSWORD_PATH=/reset-password.html
```

## 7. Sanitization HTML articles

Le HTML des articles est nettoyé côté backend. Les scripts, iframes, handlers JS inline et liens `javascript:` sont retirés.

## 8. Uploads plus robustes

Les dossiers `/uploads/articles` et `/uploads/signalements` sont créés automatiquement si absents.

## 9. Gestion d’erreurs améliorée

Le backend retourne un message plus clair pour les erreurs PostgreSQL `CHECK constraint`, notamment les erreurs du type `articles_statut_check`.
