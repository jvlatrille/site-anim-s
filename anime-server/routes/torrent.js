import { Router } from "express";
import fetch from "node-fetch";
import { parseStringPromise } from "xml2js";
import WebTorrent from "webtorrent";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import TorrentSearchApi from "torrent-search-api";
import { selectVideoFile } from "../utils/selectVideoFile.js";
import { ffmpeg } from "../utils/videoPaths.js";
import { getVideoAbsolutePath } from "../utils/videoPaths.js";
import { Writable } from "stream";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// =========================
// WebTorrent + dossiers
// =========================
const client = new WebTorrent();
const DOWNLOADS_DIR = path.join(__dirname, "..", "downloads");
if (!fs.existsSync(DOWNLOADS_DIR))
  fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });

// caches anti-dup
const SRC_TO_TORRENT = new Map(); // key (src canonique) -> torrent
const PENDING = new Map(); // key -> Promise<torrent>

// helpers canonisation
function canonicalSrc({ magnet, torrentUrl }) {
  if (magnet) {
    try {
      magnet = decodeURIComponent(magnet);
    } catch {}
    return magnet;
  }
  return torrentUrl;
}

// lit les premiers octets pour forcer le download de l'en-tête (mkv/ffprobe)
function prefetchHeader(file, bytes = 8 * 1024 * 1024) {
  return new Promise((resolve) => {
    const end = Math.min(file.length - 1, Math.max(0, bytes - 1));
    const rs = file.createReadStream({ start: 0, end });
    // on jette les données (no-op)
    rs.on("error", () => resolve());
    rs.on("end", () => resolve());
    rs.resume(); // lit sans pipe
  });
}

// langues jolies
function pickLangLabel(tags = {}) {
  const l = (tags.language || tags.lang || "").toLowerCase();
  if (l.startsWith("fr") || l === "fre" || l === "fra") return { lang: "fr", label: "Français" };
  if (l.startsWith("en")) return { lang: "en", label: "English" };
  if (l) return { lang: l.slice(0,2), label: l.toUpperCase() };
  return { lang: "und", label: "Sub" };
}

// codecs texte supportés pour conversion → .vtt
const TEXT_SUB_CODECS = new Set([
  "ass","ssa","subrip","srt","mov_text","text","webvtt"
]);


function getOrAddTorrent(src) {
  // déjà dans WebTorrent ?
  let t = client.get(src);
  if (t) return Promise.resolve(t);
  // dans notre cache ?
  t = SRC_TO_TORRENT.get(src);
  if (t) return Promise.resolve(t);
  // ajout en cours ?
  if (PENDING.has(src)) return PENDING.get(src);

  // sinon on lance un ajout unique (promesse partagée)
  const p = new Promise((resolve, reject) => {
    try {
      const wt = client.add(src, { path: DOWNLOADS_DIR }, (torrent) => {
        SRC_TO_TORRENT.set(src, torrent);
        PENDING.delete(src);
        resolve(torrent);
      });

      wt.once("error", (err) => {
        PENDING.delete(src);
        // si doublon malgré tout, on tente de récupérer l’existant
        if (
          String(err?.message || err)
            .toLowerCase()
            .includes("duplicate")
        ) {
          const existing = client.get(src);
          if (existing) return resolve(existing);
        }
        reject(err);
      });
    } catch (e) {
      PENDING.delete(src);
      reject(e);
    }
  });

  PENDING.set(src, p);
  return p;
}

// =========================
// Providers publics (1337x, TPB…)
// =========================
TorrentSearchApi.enablePublicProviders();
// Si tu veux Ygg (compte requis) :
// TorrentSearchApi.enableProvider('YggTorrent', 'EMAIL', 'MDP');

// =========================
// Recherche Nyaa (RSS)
// =========================
function buildQueries(anime, episode) {
  const ep = episode ? String(episode) : "";
  const ep2 = episode ? String(episode).padStart(2, "0") : "";
  const langTokens = ["VOSTFR", "VOSTF", "SUB FR", "French Sub", "Multi-Subs"];
  const forms = episode
    ? [
        `E${ep}`,
        `E${ep2}`,
        `Episode ${ep}`,
        `Episode ${ep2}`,
        `${ep}`,
        `${ep2}`,
        `S01E${ep2}`,
      ]
    : [""];

  const out = [];
  for (const f of forms) {
    for (const L of langTokens)
      out.push([anime, f, L].filter(Boolean).join(" ").trim());
    out.push([anime, f].filter(Boolean).join(" ").trim());
  }
  out.push(anime);
  return Array.from(new Set(out)).slice(0, 12);
}

function parseNyaaItem(it) {
  const title = it.title?.[0] || "";
  const pageLink = it.guid?.[0]?._ || it.link?.[0] || "";
  const magnet = it["torrent:magnetURI"]?.[0]?.startsWith("magnet:")
    ? it["torrent:magnetURI"][0]
    : null;
  const enclosure = it.enclosure?.[0]?.$;
  const torrentUrl = enclosure?.url?.endsWith(".torrent")
    ? enclosure.url
    : null;
  const size = it["nyaa:size"]?.[0] || null;
  const seeds = it["nyaa:seeders"]?.[0] ? Number(it["nyaa:seeders"][0]) : null;
  const leech = it["nyaa:leechers"]?.[0]
    ? Number(it["nyaa:leechers"][0])
    : null;

  return {
    name: title,
    magnet,
    torrentUrl,
    size,
    seeds,
    leech,
    pageLink,
    source: "nyaa",
  };
}

async function searchNyaaMany(queries) {
  const all = [];
  for (const q of queries) {
    const url = `https://nyaa.si/?page=rss&q=${encodeURIComponent(
      q
    )}&c=1_2&f=0&t=${Date.now()}`;
    const r = await fetch(url, { headers: { "User-Agent": "anime-server" } });
    const xml = await r.text();
    const rss = await parseStringPromise(xml);
    const items = rss?.rss?.channel?.[0]?.item || [];
    const parsed = items
      .map(parseNyaaItem)
      .filter((x) => x.magnet || x.torrentUrl);
    all.push(...parsed);
    if (parsed.length >= 8) break;
  }
  return all;
}

function normalizeTorrentSearchApi(ts) {
  return {
    name: ts.title || ts.name || "Sans titre",
    magnet: ts.magnet || null,
    torrentUrl: ts.link?.endsWith(".torrent") ? ts.link : null,
    size: ts.size || null,
    seeds:
      typeof ts.seeds === "number"
        ? ts.seeds
        : typeof ts.seeders === "number"
        ? ts.seeders
        : null,
    leech:
      typeof ts.peers === "number"
        ? ts.peers
        : typeof ts.leechers === "number"
        ? ts.leechers
        : null,
    pageLink: ts.desc || ts.href || null,
    source: ts.provider || "public",
  };
}

function filterEpisodeMatches(items, episode) {
  if (!episode) return items;
  const ep = String(episode);
  const ep2 = ep.padStart(2, "0");
  const re = new RegExp(
    String.raw`(?:^|\D)(?:s\d+e)?(?:ep?|e)?\s*0*${ep}(?:v\d+)?(?:\D|$)`,
    "i"
  );
  const re2 = new RegExp(
    String.raw`(?:^|\D)(?:s\d+e)?(?:ep?|e)?\s*0*${ep2}(?:v\d+)?(?:\D|$)`,
    "i"
  );
  return items.filter(({ name }) => {
    const n = (name || "").toLowerCase();
    return re.test(n) || re2.test(n);
  });
}

function sortBySeedsThenSize(items) {
  const toBytes = (s) => {
    if (!s || typeof s !== "string") return 0;
    const m = s.match(/([\d.]+)\s*(KiB|MiB|GiB|TiB|KB|MB|GB|TB)/i);
    if (!m) return 0;
    const n = parseFloat(m[1]);
    const u = m[2].toLowerCase();
    const map = {
      kib: 1024,
      mib: 1024 ** 2,
      gib: 1024 ** 3,
      tib: 1024 ** 4,
      kb: 1000,
      mb: 1000 ** 2,
      gb: 1000 ** 3,
      tb: 1000 ** 4,
    };
    return n * (map[u] || 0);
  };
  return items.sort((a, b) => {
    const sa = a.seeds ?? -1,
      sb = b.seeds ?? -1;
    if (sb !== sa) return sb - sa;
    return toBytes(b.size) - toBytes(a.size);
  });
}

function waitReady(torrent, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    if (!torrent) return reject(new Error("Torrent introuvable"));
    if (torrent.ready || (torrent.files && torrent.files.length))
      return resolve(torrent);
    const onReady = () => {
      cleanup();
      resolve(torrent);
    };
    const onErr = (e) => {
      cleanup();
      reject(e || new Error("Erreur torrent"));
    };
    const to = setTimeout(() => {
      cleanup();
      resolve(torrent); // on résout quand même: on tentera selectVideoFile()
    }, timeoutMs);
    function cleanup() {
      clearTimeout(to);
      torrent.off("ready", onReady);
      torrent.off("error", onErr);
    }
    torrent.once("ready", onReady);
    torrent.once("error", onErr);
  });
}

// =========================
// ROUTES
// =========================

router.get("/torrents", async (req, res) => {
  try {
    const { anime, episode } = req.query;
    if (!anime)
      return res.status(400).json({ error: "Paramètre 'anime' manquant" });

    const queries = buildQueries(anime, episode);
    const tried = [];

    const nyaaRes = await searchNyaaMany(queries);
    tried.push({
      source: "nyaa",
      qCount: queries.length,
      found: nyaaRes.length,
    });

    const altQueries = [`${anime} ${episode ?? ""}`.trim(), anime].filter(
      Boolean
    );
    const tsaRes = [];
    for (const q of Array.from(new Set(altQueries))) {
      try {
        const arr = await TorrentSearchApi.search(q, "All", 20);
        tsaRes.push(...arr.map(normalizeTorrentSearchApi));
        tried.push({ source: "public", q, count: arr.length });
        if (tsaRes.length >= 20) break;
      } catch (e) {
        tried.push({ source: "public", q, error: true });
      }
    }

    const byKey = new Map();
    for (const t of [...nyaaRes, ...tsaRes]) {
      const key = t.magnet || t.torrentUrl || t.pageLink || t.name;
      if (!key || byKey.has(key)) continue;
      byKey.set(key, t);
    }
    const all = Array.from(byKey.values());

    let exact = episode ? filterEpisodeMatches(all, episode) : all;
    exact = sortBySeedsThenSize(exact);

    let candidates = [];
    let batches = [];
    if (episode && exact.length === 0) {
      const hasAnyNumber = (s) => /\d{1,3}/.test(s || "");
      candidates = sortBySeedsThenSize(
        all.filter((t) => hasAnyNumber(t.name))
      ).slice(0, 15);

      const batchQueries = [
        `${anime} batch`,
        `${anime} season`,
        `${anime} complete`,
        `${anime} S01`,
        `${anime} pack`,
      ];
      const nyaaBatch = await searchNyaaMany(batchQueries);
      const tsaBatch = [];
      for (const q of batchQueries.slice(0, 2)) {
        try {
          const arr = await TorrentSearchApi.search(q, "All", 20);
          tsaBatch.push(...arr.map(normalizeTorrentSearchApi));
        } catch {}
      }
      const bMap = new Map();
      for (const t of [...nyaaBatch, ...tsaBatch]) {
        const key = t.magnet || t.torrentUrl || t.pageLink || t.name;
        if (!key || bMap.has(key)) continue;
        bMap.set(key, t);
      }
      batches = sortBySeedsThenSize(Array.from(bMap.values())).slice(0, 20);
    }

    const debug = req.query.debug === "1";
    const payload = { torrents: exact, candidates, batches };
    if (debug) payload.debug = { tried, totalFound: all.length };
    res.json(payload);
  } catch (e) {
    console.error("ERR /api/torrents", e);
    res.status(500).json({ error: "Recherche torrent échouée" });
  }
});

/**
 * POST /api/download  { magnet? , torrentUrl? } -> { infoHash }
 */
router.post("/download", async (req, res) => {
  try {
    let { magnet, torrentUrl } = req.body || {};
    if (typeof magnet === "string") {
      try {
        magnet = decodeURIComponent(magnet);
      } catch {}
    }
    const src = canonicalSrc({ magnet, torrentUrl });
    if (!src)
      return res.status(400).json({ error: "magnet ou torrentUrl requis" });

    let tor = client.get(src) || SRC_TO_TORRENT.get(src);
    if (!tor) tor = await getOrAddTorrent(src);

    // attend au moins les métadatas
    await waitReady(tor);

    return res.json({ infoHash: tor.infoHash });
  } catch (e) {
    console.error("ERR /api/download", e);
    res.status(500).json({ error: "Download échoué" });
  }
});

/**
 * Streaming:
 *  - GET /api/stream/:infoHash
 *  - GET /api/stream?magnet=... | ?torrentUrl=...
 */
function findByInfoHash(id) {
  const needle = String(id).toLowerCase();
  return (
    client.torrents.find((t) => (t.infoHash || "").toLowerCase() === needle) ||
    client.get(id)
  );
}

router.get("/stream/:infoHash", async (req, res) => {
  try {
    const { infoHash } = req.params;
    let torrent = findByInfoHash(infoHash);
    if (!torrent) return res.status(404).send("Torrent introuvable");

    await waitReady(torrent);

    const file = selectVideoFile(torrent);
    if (!file) return res.status(404).send("Fichier vidéo introuvable");

    return streamFile(file, req, res);
  } catch (e) {
    console.error("ERR /stream/:infoHash", e);
    if (!res.headersSent) res.status(500).send("Erreur de streaming");
  }
});

router.get("/stream", async (req, res) => {
  try {
    let { magnet, torrentUrl } = req.query;
    if (typeof magnet === "string") {
      try {
        magnet = decodeURIComponent(magnet);
      } catch {}
    }
    const src = canonicalSrc({ magnet, torrentUrl });
    if (!src)
      return res.status(400).send("Paramètre magnet ou torrentUrl requis");

    let torrent = client.get(src) || SRC_TO_TORRENT.get(src);
    if (!torrent) {
      torrent = await getOrAddTorrent(src);
    }
    await waitReady(torrent);
    const file = selectVideoFile(torrent);
    if (!file) return res.status(404).send("Fichier vidéo introuvable");
    return streamFile(file, req, res);
  } catch (e) {
    console.error("ERR /api/stream", e);
    if (!res.headersSent) res.status(500).send("Erreur de streaming");
  }
});

// ---- Helpers sous-titres ----
import os from "os";
const SUB_CACHE_DIR = path.join(__dirname, "..", "sub_cache");
if (!fs.existsSync(SUB_CACHE_DIR))
  fs.mkdirSync(SUB_CACHE_DIR, { recursive: true });

// helper pour attendre que le fichier apparaisse côté FS (WebTorrent écrit à la volée)
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
async function waitFileExists(p, tries = 20, delay = 250) {
  for (let i = 0; i < tries; i++) {
    if (fs.existsSync(p)) return true;
    await sleep(delay);
  }
  return false;
}

router.get("/subtitles/:infoHash", async (req, res) => {
  try {
    const { infoHash } = req.params;
    const torrent = findByInfoHash(infoHash);
    if (!torrent) return res.status(404).json({ tracks: [] });

    await waitReady(torrent);

    const file = selectVideoFile(torrent);
    if (!file) return res.json({ tracks: [] });

    // force l’en-tête (métadonnées mkv) à être présent
    await prefetchHeader(file);

    // calcule chemin absolu
    const root = torrent.path || DOWNLOADS_DIR;
    const videoFileAbs = path.isAbsolute(file.path) ? file.path : path.join(root, file.path);

    // ffprobe
    const probe = await new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoFileAbs, (err, data) => err ? reject(err) : resolve(data));
    });

    // pistes intégrées → ne garde que les codecs texte
    const embedded = (probe.streams || [])
      .filter(s => s.codec_type === "subtitle" && TEXT_SUB_CODECS.has((s.codec_name || "").toLowerCase()))
      .map((s, idx) => {
        const { lang, label } = pickLangLabel(s.tags || {});
        return {
          id: `s-${idx}`,
          type: "embedded",
          lang, label,
          codec: (s.codec_name || "sub").toLowerCase(),
          src: `/api/subtitles/${infoHash}/s-${idx}.vtt`
        };
      });

    // fichiers externes .srt/.ass dans le torrent
    const externals = (torrent.files || [])
      .filter(f => /\.(srt|ass|ssa)$/i.test(f.name))
      .map((f, idx) => {
        const name = f.name.toLowerCase();
        let lang = "und", label = "Sub";
        if (name.includes("fr") || name.includes("french")) { lang = "fr"; label = "Français"; }
        else if (name.includes("en") || name.includes("english")) { lang = "en"; label = "English"; }
        return {
          id: `f-${idx}`,
          type: "external",
          lang, label,
          codec: path.extname(f.name).slice(1).toLowerCase(),
          src: `/api/subtitles/${infoHash}/f-${idx}.vtt`
        };
      });

    // tri: FR d'abord
    const tracks = [...embedded, ...externals].sort((a,b) => {
      if (a.lang === "fr" && b.lang !== "fr") return -1;
      if (b.lang === "fr" && a.lang !== "fr") return 1;
      return 0;
    });

    res.json({ tracks });
  } catch (e) {
    console.error("ERR /api/subtitles list", e);
    res.status(500).json({ tracks: [] });
  }
});


router.get("/subtitles/:infoHash/:trackId.vtt", async (req, res) => {
  try {
    const { infoHash, trackId } = req.params;
    const torrent = findByInfoHash(infoHash);
    if (!torrent) return res.status(404).send("Not found");

    const cachePath = path.join(SUB_CACHE_DIR, `${infoHash}-${trackId}.vtt`);
    if (fs.existsSync(cachePath)) {
      res.setHeader("Content-Type", "text/vtt; charset=utf-8");
      return fs.createReadStream(cachePath).pipe(res);
    }

    if (trackId.startsWith("s-")) {
      const sIdx = parseInt(trackId.split("-")[1], 10);
      const file = selectVideoFile(torrent);
      if (!file) return res.status(404).send("No video");

      await prefetchHeader(file);

      const root = torrent.path || DOWNLOADS_DIR;
      const videoFileAbs = path.isAbsolute(file.path) ? file.path : path.join(root, file.path);

      // on tente la conversion → si codec non-texte, ffmpeg va râler : on renvoie 415
      await new Promise((resolve, reject) => {
        ffmpeg(videoFileAbs)
          .outputOptions([`-map 0:s:${sIdx}`, "-f webvtt", "-loglevel error"])
          .save(cachePath)
          .on("end", resolve)
          .on("error", reject);
      }).catch(() => { throw Object.assign(new Error("Unsupported sub stream"), { code: 415 }); });

      res.setHeader("Content-Type", "text/vtt; charset=utf-8");
      return fs.createReadStream(cachePath).pipe(res);
    }

    if (trackId.startsWith("f-")) {
      const fIdx = parseInt(trackId.split("-")[1], 10);
      const subFile = (torrent.files || []).filter(f => /\.(srt|ass|ssa)$/i.test(f.name))[fIdx];
      if (!subFile) return res.status(404).send("No sub file");

      const root = torrent.path || DOWNLOADS_DIR;
      const abs = path.isAbsolute(subFile.path) ? subFile.path : path.join(root, subFile.path);

      await new Promise((resolve, reject) => {
        ffmpeg(abs)
          .outputOptions(["-f webvtt", "-loglevel error"])
          .save(cachePath)
          .on("end", resolve)
          .on("error", reject);
      });

      res.setHeader("Content-Type", "text/vtt; charset=utf-8");
      return fs.createReadStream(cachePath).pipe(res);
    }

    return res.status(400).send("Invalid track id");
  } catch (e) {
    if (e.code === 415) return res.status(415).send("Unsupported subtitle codec");
    console.error("ERR /api/subtitles serve", e);
    if (!res.headersSent) res.status(500).send("Sub error");
  }
});


function streamFile(file, req, res) {
  const size = file.length;
  const range = req.headers.range;
  const name = file.name.toLowerCase();
  const contentType = name.endsWith(".mkv") ? "video/x-matroska" : "video/mp4";

  // sécurise la fermeture/abandon côté client
  let readable;

  const safeEnd = (code, msg) => {
    if (!res.headersSent && code) res.status(code);
    if (!res.writableEnded) {
      try {
        res.end();
      } catch {}
    }
    if (readable) {
      try {
        readable.destroy();
      } catch {}
    }
  };

  // si le client ferme → on détruit le stream proprement
  res.on("close", () => {
    if (res.writableEnded) return;
    if (readable) {
      try {
        readable.destroy();
      } catch {}
    }
  });
  res.on("error", () => {
    if (readable) {
      try {
        readable.destroy();
      } catch {}
    }
  });

  // helper: pipe + gestion d'erreurs (ignore les aborts)
  const pipeSafe = (rs) => {
    readable = rs;
    rs.on("error", (err) => {
      const msg = String(err?.message || err);
      // erreurs normales quand le navigateur annule une Range
      if (
        msg.includes("Writable stream closed prematurely") ||
        msg.includes("aborted") ||
        msg.includes("Premature close") ||
        msg.includes("ERR_STREAM_PREMATURE_CLOSE")
      ) {
        return safeEnd(); // on ignore
      }
      console.error("Stream error:", msg);
      return safeEnd(500);
    });
    rs.pipe(res);
  };

  // Pas de Range => on envoie tout
  if (!range) {
    res.writeHead(200, {
      "Content-Length": size,
      "Content-Type": contentType,
      "Accept-Ranges": "bytes",
      "Cache-Control": "no-store",
    });
    return pipeSafe(file.createReadStream());
  }

  // Range partielle
  const [startStr, endStr] = range.replace(/bytes=/, "").split("-");
  const start = parseInt(startStr, 10);
  // chunk ~2MB par défaut
  const end = endStr
    ? parseInt(endStr, 10)
    : Math.min(start + 2 * 1024 * 1024, size - 1);
  const chunkSize = end - start + 1;

  // garde-fous
  if (isNaN(start) || isNaN(end) || start < 0 || end >= size || start > end) {
    res.setHeader("Content-Range", `bytes */${size}`);
    return res.status(416).end(); // Range Not Satisfiable
  }

  res.writeHead(206, {
    "Content-Range": `bytes ${start}-${end}/${size}`,
    "Accept-Ranges": "bytes",
    "Content-Length": chunkSize,
    "Content-Type": contentType,
    "Cache-Control": "no-store",
  });

  return pipeSafe(file.createReadStream({ start, end }));
}

// ignorer les erreurs d'abandon de flux pour éviter un crash process
process.on("uncaughtException", (err) => {
  const msg = String(err?.message || err);
  if (
    msg.includes("Writable stream closed prematurely") ||
    msg.includes("ERR_STREAM_PREMATURE_CLOSE")
  ) {
    console.warn("Ignoré: ", msg);
    return;
  }
  console.error("uncaughtException:", err);
});
process.on("unhandledRejection", (err) => {
  const msg = String(err?.message || err);
  if (
    msg.includes("Writable stream closed prematurely") ||
    msg.includes("ERR_STREAM_PREMATURE_CLOSE")
  ) {
    console.warn("Ignoré: ", msg);
    return;
  }
  console.error("unhandledRejection:", err);
});

export default router;
