import http from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeYoudao, voiceType, YOUDAO_API, YOUDAO_VOICE } from './server/youdao.js';

const root = fileURLToPath(new URL('.', import.meta.url));
const args = new Set(process.argv.slice(2));
const portArgument = process.argv.indexOf('--port');
const port = portArgument >= 0 ? Number(process.argv[portArgument + 1]) : Number(process.env.PORT || 4173);
const development = args.has('--dev');
const dictionaryCache = new Map();
const audioCache = new Map();
const vite = development
  ? await (await import('vite')).createServer({ root, appType: 'spa', configLoader: 'runner', server: { middlewareMode: true } })
  : null;

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url || '/', `http://${request.headers.host || '127.0.0.1'}`);
    if (url.pathname === '/api/youdao') return await dictionaryRoute(url, response);
    if (url.pathname === '/api/youdao/voice') return await voiceRoute(url, response);
    if (vite) return vite.middlewares(request, response, () => sendJson(response, 404, { error: '页面不存在' }));
    return serveStatic(url.pathname, response);
  } catch (error) {
    return sendJson(response, 500, { error: `服务器错误：${error.message}` });
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`HOME ATLAS online dictionary server: http://127.0.0.1:${port}/`);
});

async function dictionaryRoute(url, response) {
  const query = String(url.searchParams.get('q') || '').trim();
  if (!/^[a-zA-Z][a-zA-Z '\-]*$/.test(query)) return sendJson(response, 400, { error: '请输入英文单词或短语' });
  const key = query.toLowerCase();
  if (dictionaryCache.has(key)) return sendJson(response, 200, dictionaryCache.get(key));
  const upstream = new URL(YOUDAO_API);
  upstream.searchParams.set('jsonversion', '2');
  upstream.searchParams.set('q', query);
  const result = await fetchUpstream(upstream);
  const data = await result.json();
  const normalized = normalizeYoudao(data, query);
  normalized.audioUK = `/api/youdao/voice?word=${encodeURIComponent(normalized.word)}&accent=uk`;
  normalized.audioUS = `/api/youdao/voice?word=${encodeURIComponent(normalized.word)}&accent=us`;
  dictionaryCache.set(key, normalized);
  return sendJson(response, 200, normalized);
}

async function voiceRoute(url, response) {
  const word = String(url.searchParams.get('word') || '').trim();
  const accent = String(url.searchParams.get('accent') || '');
  if (!/^[a-zA-Z][a-zA-Z '\-]*$/.test(word)) return sendJson(response, 400, { error: '无效单词' });
  let type;
  try { type = voiceType(accent); } catch (error) { return sendJson(response, 400, { error: error.message }); }
  const key = `${word.toLowerCase()}:${accent}`;
  let audio = audioCache.get(key);
  if (!audio) {
    const upstream = new URL(YOUDAO_VOICE);
    upstream.searchParams.set('audio', word);
    upstream.searchParams.set('type', String(type));
    const result = await fetchUpstream(upstream);
    const bytes = Buffer.from(await result.arrayBuffer());
    if (bytes.length < 512 || bytes[0] === 0x3c || bytes[0] === 0x7b) throw new Error('有道未返回有效音频');
    audio = { bytes, contentType: result.headers.get('content-type') || 'audio/mpeg' };
    audioCache.set(key, audio);
  }
  response.writeHead(200, { 'Content-Type': audio.contentType, 'Content-Length': audio.bytes.length, 'Cache-Control': 'private, max-age=86400' });
  response.end(audio.bytes);
}

async function fetchUpstream(url) {
  const result = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 HOMEAtlasDictionary/1.0' }, signal: AbortSignal.timeout(15_000) });
  if (!result.ok) throw new Error(`有道服务返回 HTTP ${result.status}`);
  return result;
}

function serveStatic(pathname, response) {
  const dist = join(root, 'dist');
  const relative = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, '').replace(/^[/\\]+/, '');
  let path = join(dist, relative || 'index.html');
  if (!existsSync(path) || statSync(path).isDirectory()) path = join(dist, 'index.html');
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.ttf': 'font/ttf' };
  response.writeHead(200, { 'Content-Type': types[extname(path).toLowerCase()] || 'application/octet-stream' });
  createReadStream(path).pipe(response);
}

function sendJson(response, status, payload) {
  const body = JSON.stringify(payload);
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body), 'Cache-Control': 'no-store' });
  response.end(body);
}
