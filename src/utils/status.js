const ARTICLE_STATUSES = ['en_attente', 'publie', 'rejete'];
const SIGNALEMENT_STATUSES = ['en_attente', 'valide', 'en_cours', 'traite', 'rejete'];

const articleAliases = {
  en_attente: 'en_attente',
  attente: 'en_attente',
  publie: 'publie',
  publié: 'publie',
  publiee: 'publie',
  publiée: 'publie',
  rejete: 'rejete',
  rejeté: 'rejete',
  rejetee: 'rejete',
  rejetée: 'rejete',
};

const signalementAliases = {
  en_attente: 'en_attente',
  attente: 'en_attente',
  valide: 'valide',
  validé: 'valide',
  validee: 'valide',
  validée: 'valide',
  en_cours: 'en_cours',
  'en cours': 'en_cours',
  traitement: 'en_cours',
  traite: 'traite',
  traité: 'traite',
  traitee: 'traite',
  traitée: 'traite',
  rejete: 'rejete',
  rejeté: 'rejete',
  rejetee: 'rejete',
  rejetée: 'rejete',
};

function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/-/g, '_')
    .replace(/\s+/g, ' ');
}

function normalizeArticleStatut(value) {
  const normalized = normalizeText(value);
  return articleAliases[normalized] || null;
}

function normalizeSignalementStatut(value) {
  const normalized = normalizeText(value);
  return signalementAliases[normalized] || null;
}

function articleStatusMessage() {
  return ARTICLE_STATUSES.join(', ');
}

function signalementStatusMessage() {
  return SIGNALEMENT_STATUSES.join(', ');
}

module.exports = {
  ARTICLE_STATUSES,
  SIGNALEMENT_STATUSES,
  normalizeArticleStatut,
  normalizeSignalementStatut,
  articleStatusMessage,
  signalementStatusMessage,
};
