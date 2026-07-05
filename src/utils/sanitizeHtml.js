// Petit sanitizer HTML sans dépendance externe.
// Objectif : garder un contenu riche simple pour les articles, tout en retirant
// scripts, événements JS inline et liens javascript:.
const ALLOWED_TAGS = new Set(['p', 'br', 'b', 'strong', 'i', 'em', 'u', 'ul', 'ol', 'li', 'blockquote', 'h2', 'h3', 'h4', 'a']);
const VOID_TAGS = new Set(['br']);
const ALLOWED_ATTRS = {
  a: new Set(['href', 'title', 'target', 'rel']),
};

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function decodeAttr(value) {
  return String(value || '')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .trim();
}

function sanitizeUrl(value) {
  const decoded = decodeAttr(value).replace(/[\u0000-\u001F\u007F\s]+/g, '');
  if (!decoded) return null;
  if (/^(https?:\/\/|mailto:|tel:|\/)/i.test(decoded)) return value;
  return null;
}

function sanitizeAttributes(tagName, rawAttrs = '') {
  const allowed = ALLOWED_ATTRS[tagName];
  if (!allowed) return '';

  const attrs = [];
  const attrRegex = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*("[^"]*"|'[^']*'|[^\s"'>]+)/g;
  let match;
  while ((match = attrRegex.exec(rawAttrs)) !== null) {
    const name = match[1].toLowerCase();
    if (name.startsWith('on') || !allowed.has(name)) continue;

    let value = match[2] || '';
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (name === 'href' && !sanitizeUrl(value)) continue;
    if (name === 'target' && !['_blank', '_self'].includes(value)) continue;

    attrs.push(`${name}="${escapeHtml(value)}"`);
  }

  if (tagName === 'a') {
    const hasTargetBlank = attrs.some((attr) => attr === 'target="_blank"');
    const hasRel = attrs.some((attr) => attr.startsWith('rel='));
    if (hasTargetBlank && !hasRel) attrs.push('rel="noopener noreferrer"');
  }

  return attrs.length ? ` ${attrs.join(' ')}` : '';
}

function sanitizeHtml(input) {
  if (!input) return '';

  let html = String(input);
  html = html.replace(/<\s*(script|style|iframe|object|embed|link|meta)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '');
  html = html.replace(/<\s*(script|style|iframe|object|embed|link|meta)[^>]*\/?>/gi, '');

  return html.replace(/<\/?[^>]+>/g, (rawTag) => {
    const tagMatch = rawTag.match(/^<\s*(\/?)\s*([a-zA-Z0-9]+)([^>]*)>/);
    if (!tagMatch) return '';

    const isClosing = Boolean(tagMatch[1]);
    const tagName = tagMatch[2].toLowerCase();
    const rawAttrs = tagMatch[3] || '';

    if (!ALLOWED_TAGS.has(tagName)) return '';
    if (isClosing) return VOID_TAGS.has(tagName) ? '' : `</${tagName}>`;
    if (VOID_TAGS.has(tagName)) return `<${tagName}>`;

    return `<${tagName}${sanitizeAttributes(tagName, rawAttrs)}>`;
  }).trim();
}

module.exports = { sanitizeHtml, escapeHtml };
