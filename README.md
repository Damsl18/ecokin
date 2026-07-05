# ecokin
# EcoKin — Backend

Backend Node.js/Express + PostgreSQL de la plateforme EcoKin.

📄 Voir **[ARCHITECTURE.md](./ARCHITECTURE.md)** pour la documentation
complète : structure du projet, liste des endpoints, champs de formulaires
attendus, décisions techniques prises en attendant le front.

## Démarrage rapide

```bash
npm install
cp .env.example .env   # puis remplir les identifiants PostgreSQL
psql -d ecokin -f database/schema.sql
npm run dev
```

Serveur disponible sur `http://localhost:5000`, health check sur
`GET /api/health`.
