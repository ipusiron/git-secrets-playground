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

// Day031 第2弾の参照実装（本物の Git オブジェクト: SHA-1・zlib・見出しの解析・commit と tree の読み取り）
// ブラウザーと Node 22 の両方にある Web の API（crypto.subtle・CompressionStream・DecompressionStream）だけを使う

function hexToBytes(hex) {
  const s = String(hex).replace(/\s+/g, '').toLowerCase();
  if (!/^([0-9a-f]{2})*$/.test(s)) throw new Error('notHex');
  const out = new Uint8Array(s.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(s.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function bytesToHex(bytes) {
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

async function streamBytes(bytes, stream) {
  const res = new Response(new Blob([bytes]).stream().pipeThrough(stream));
  return new Uint8Array(await res.arrayBuffer());
}

// zlib 形式（Git のルーズオブジェクトと同じ）の圧縮と解凍。壊れたデータは例外 'badZlib'
async function deflate(bytes) {
  return streamBytes(bytes, new CompressionStream('deflate'));
}
async function inflate(bytes) {
  try {
    return await streamBytes(bytes, new DecompressionStream('deflate'));
  } catch {
    throw new Error('badZlib');
  }
}

async function sha1Hex(bytes) {
  return bytesToHex(new Uint8Array(await crypto.subtle.digest('SHA-1', bytes)));
}

// 見出し＋中身: "<type> <バイト数>\0" のあとに中身
function encodeObject(type, body) {
  const head = new TextEncoder().encode(`${type} ${body.length}\u0000`);
  const out = new Uint8Array(head.length + body.length);
  out.set(head); out.set(body, head.length);
  return out;
}

async function hashObject(type, body) {
  return sha1Hex(encodeObject(type, body));
}

// 解凍したバイト列を見出しと中身に分ける。見出しがない・種類が違う・サイズが合わないときは例外
function parseObject(raw) {
  const nul = raw.indexOf(0);
  if (nul < 0) throw new Error('noHeader');
  const m = /^(blob|tree|commit|tag) (\d+)$/.exec(new TextDecoder().decode(raw.slice(0, nul)));
  if (!m) throw new Error('badHeader');
  const body = raw.slice(nul + 1);
  if (Number(m[2]) !== body.length) throw new Error('sizeMismatch');
  return { type: m[1], size: body.length, body };
}

// commit の本文: tree・parent（0個以上）・author・committer・空行・メッセージ
function parseCommit(body) {
  const text = new TextDecoder().decode(body);
  const [head, ...rest] = text.split('\n\n');
  const out = { tree: null, parents: [], author: null, committer: null, message: rest.join('\n\n').replace(/\n$/, '') };
  for (const line of head.split('\n')) {
    const sp = line.indexOf(' ');
    const key = line.slice(0, sp), value = line.slice(sp + 1);
    if (key === 'tree') out.tree = value;
    else if (key === 'parent') out.parents.push(value);
    else if (key === 'author') out.author = value;
    else if (key === 'committer') out.committer = value;
  }
  return out;
}

// tree の本文: "<mode> <name>\0" のあとに 20 バイトのハッシュ、の繰り返し
function parseTree(body) {
  const out = [];
  let i = 0;
  while (i < body.length) {
    const sp = body.indexOf(0x20, i), nul = body.indexOf(0, sp);
    const mode = new TextDecoder().decode(body.slice(i, sp));
    const name = new TextDecoder().decode(body.slice(sp + 1, nul));
    const hash = bytesToHex(body.slice(nul + 1, nul + 21));
    out.push({ mode, name, hash, type: mode === '40000' ? 'tree' : 'blob' });
    i = nul + 21;
  }
  return out;
}

// ルーズオブジェクトを開く: 解凍 → 見出しの解析 → SHA-1 を計算して、期待するハッシュ（置き場所から）と比べる
async function openLoose(expectedHash, compressed) {
  const raw = await inflate(compressed);
  const obj = parseObject(raw);
  const actual = await sha1Hex(raw);
  return { ...obj, hash: actual, matches: actual === String(expectedHash).toLowerCase() };
}


function webCryptoAvailable() {
  return Boolean(globalThis.crypto?.subtle && typeof CompressionStream === 'function' && typeof DecompressionStream === 'function');
}

const GitCore = {
  normalizeHash, isValidHash, objectPath, blobHeader, treeStats, isHttpUrl, webCryptoAvailable,
  hexToBytes, bytesToHex, deflate, inflate, sha1Hex, encodeObject, hashObject, parseObject, parseCommit, parseTree, openLoose
};
if (typeof module !== 'undefined' && module.exports) module.exports = GitCore;
