import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function PlayerPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [infoHash, setInfoHash] = useState(null);
  const [videoSrc, setVideoSrc] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!state?.magnet && !state?.torrentUrl) {
      navigate('/');
      return;
    }
    (async () => {
      try {
        setLoading(true);
        // 1) on “réserve” le torrent et on récupère un infoHash stable
        const r = await fetch('/api/download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ magnet: state.magnet || null, torrentUrl: state.torrentUrl || null })
        });
        const j = await r.json();
        if (!j.infoHash) throw new Error('Aucun infoHash');
        setInfoHash(j.infoHash);
        // 2) on streame via /api/stream/:infoHash (plus fiable que ?magnet= en boucle)
        setVideoSrc(`/api/stream/${j.infoHash}`);
        setErr("");
      } catch (e) {
        console.error(e);
        setErr("Impossible de préparer la lecture.");
      } finally {
        setLoading(false);
      }
    })();
  }, [state, navigate]);

  // récupérer les sous-titres quand l’infoHash est connu
  useEffect(() => {
    if (!infoHash) return;
    let cancelled = false;

    (async () => {
      for (let i=0; i<5 && !cancelled; i++) {
        try {
          const r = await fetch(`/api/subtitles/${infoHash}`);
          const j = await r.json();
          if ((j.tracks || []).length > 0) {
            setTracks(j.tracks);
            break;
          }
        } catch {}
        await new Promise(r => setTimeout(r, 800));
      }
    })();

    return () => { cancelled = true; };
  }, [infoHash]);

  // quand on reçoit les tracks, on tente de les pré-générer
useEffect(() => {
  if (!infoHash || tracks.length === 0) return;
  let cancelled = false;

  (async () => {
    const ok = [];
    for (const t of tracks) {
      try {
        const r = await fetch(`/api/subtitles/${infoHash}/${t.id}.vtt`, { method: 'GET' });
        if (r.ok && r.status < 400) ok.push(t);
      } catch {}
      if (cancelled) return;
    }
    // garde que celles qui marchent (évite afficher des pistes qui 500)
    if (!cancelled) setTracks(ok);
  })();

  return () => { cancelled = true; };
}, [infoHash, tracks.length]);



  if (!state?.magnet && !state?.torrentUrl) return null;

  return (
    <div>
      <h2>{state.animeTitle} – Épisode {state.episode}</h2>

      {loading && <p>Préparation de la lecture…</p>}
      {err && <p>{err}</p>}

      {!loading && videoSrc && (
        <div className="video-player">
          <video
            controls
            autoPlay
            src={videoSrc}
            style={{ maxWidth: "100%", border: "1px solid #1f2432", borderRadius: 12, background: "#000" }}
            crossOrigin="anonymous"
          >
            {tracks.map((t) => (
              <track
                key={t.id}
                kind="subtitles"
                srcLang={t.lang}
                label={t.label}
                src={`/api/subtitles/${infoHash}/${t.id}.vtt`}
                default={t.lang === 'fr'}
              />
            ))}
          </video>
          {tracks.length === 0 && <p style={{opacity:.7, marginTop:8}}>Aucun sous-titre détecté pour ce torrent.</p>}
        </div>
      )}
    </div>
  );
}
