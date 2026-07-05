const NIVEAUX_RISQUE = ['faible', 'moyen', 'eleve', 'critique'];
const niveauAliases = {
  faible: 'faible',
  bas: 'faible',
  moyen: 'moyen',
  modere: 'moyen',
  modéré: 'moyen',
  eleve: 'eleve',
  élevé: 'eleve',
  haute: 'eleve',
  haut: 'eleve',
  critique: 'critique',
};

function normalizeNiveauRisque(value) {
  return niveauAliases[String(value || '').trim().toLowerCase()] || null;
}

function niveauRisqueMessage() {
  return NIVEAUX_RISQUE.join(', ');
}

module.exports = { NIVEAUX_RISQUE, normalizeNiveauRisque, niveauRisqueMessage };
