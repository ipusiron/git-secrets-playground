'use strict';

// Normalize the hash without changing its meaning.
function normalizeHash(input) {
  return String(input).trim().toLowerCase();
}

function isValidHash(input) {
  return /^[0-9a-f]{40}$/.test(normalizeHash(input));
}

// Loose objects use the first two hexadecimal digits as a directory.
function objectPath(hash) {
  const h = normalizeHash(hash);
  return `.git/objects/${h.slice(0, 2)}/${h.slice(2)}`;
}

function blobHeader(byteLength) {
  return `blob ${byteLength}\u0000`;
}

function treeStats(node, stats = { high: 0, medium: 0, low: 0, files: 0, folders: 0 }) {
  if (node.type === 'file') stats.files++;
  else if (node.type === 'folder') stats.folders++;
  if (node.risk === 'high') stats.high++;
  else if (node.risk === 'medium') stats.medium++;
  else if (node.risk === 'low') stats.low++;
  (node.children || []).forEach(child => treeStats(child, stats));
  return stats;
}

function isHttpUrl(input) {
  try {
    const u = new URL(String(input).trim());
    return (u.protocol === 'http:' || u.protocol === 'https:') && u.hostname.length > 0;
  } catch {
    return false;
  }
}

const GitCore = { normalizeHash, isValidHash, objectPath, blobHeader, treeStats, isHttpUrl };
if (typeof module !== 'undefined' && module.exports) module.exports = GitCore;
