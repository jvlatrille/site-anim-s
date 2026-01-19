import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import TorrentResults from '../../components/TorrentResults'; // On gardera peut-être le composant mais stylisé via CSS global ou prop
import { getAnimeDetails, getTorrentResults } from '../../api';
import { StorageService } from '../../services/storage';
import './AnimePage.css';

export default function AnimePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [anime, setAnime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Watchlist state
  const [inWatchlist, setInWatchlist] = useState(false);

  // Episodes & Torrents
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [torrentResults, setTorrentResults] = useState({ torrents: [], candidates: [], batches: [] });
  const [loadingTorrents, setLoadingTorrents] = useState(false);
  const [errorTorrents, setErrorTorrents] = useState('');

  // 1. Charger les détails de l'anime
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getAnimeDetails(id);
        if (alive) {
          setAnime(data);
          setInWatchlist(StorageService.isInWatchlist(data.mal_id));
        }
      } catch (err) {
        if (alive) setError("Impossible de charger les informations.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  // 2. Gestion Watchlist
  const toggleWatchlist = () => {
    if (!anime) return;
    if (inWatchlist) {
      StorageService.removeFromWatchlist(anime.mal_id);
      setInWatchlist(false);
    } else {
      StorageService.addToWatchlist(anime);
      setInWatchlist(true);
    }
  };

  // 3. Gestion Episodes -> Torrents
  const handleEpisodeSelect = async (num) => {
    if (!anime) return;
    setSelectedEpisode(num);
    setTorrentResults({ torrents: [], candidates: [], batches: [] });
    setErrorTorrents('');
    setLoadingTorrents(true);

    try {
      const res = await getTorrentResults(anime.title, num);
      setTorrentResults(res);
      if (!res.torrents.length && !res.candidates.length && !res.batches.length) {
        setErrorTorrents("Aucun lien trouvé pour cet épisode.");
      }
    } catch (e) {
      setErrorTorrents("Erreur recherche torrent.");
    } finally {
      setLoadingTorrents(false);
    }
  };

  const handlePlay = (torrent) => {
    // Naviguer vers le player
    // TODO: Ajouter à l'historique ici ou dans le player ?
    // Pour l'instant on ajoute à l'historique quand on lance
    StorageService.addToHistory(anime, selectedEpisode);

    navigate('/player', {
      state: {
        magnet: torrent.magnet || null,
        torrentUrl: torrent.torrentUrl || null,
        animeId: anime.mal_id,
        animeTitle: anime.title,
        episode: selectedEpisode,
        image: anime.images?.jpg?.large_image_url
      }
    });
  };

  if (loading) return <div className="loader-page">Chargement...</div>;
  if (error) return <div className="error-page">{error}</div>;
  if (!anime) return null;

  // Données pour l'affichage
  const banner = anime.trailer?.images?.maximum_image_url || anime.images?.jpg?.large_image_url;
  const poster = anime.images?.jpg?.large_image_url;
  const episodesCount = anime.episodes || 0;
  // Générer la liste [1..N]
  const episodesList = episodesCount > 0 ? Array.from({ length: episodesCount }, (_, i) => i + 1) : [];

  return (
    <div className="anime-page">
      <Header />

      {/* HERO SECTION */}
      <section className="anime-hero">
        <div className="anime-hero-backdrop" style={{ backgroundImage: `url(${banner})` }}></div>

        <div className="anime-hero-content">
          <img src={poster} alt={anime.title} className="anime-hero-poster" />

          <div className="anime-hero-info">
            <h1 className="anime-title">{anime.title}</h1>

            <div className="anime-meta-tags">
              {anime.score && <span className="score">★ {anime.score}</span>}
              <span className="tag">{anime.year || '202X'}</span>
              <span className="tag">{anime.type || 'TV'}</span>
              <span className="tag">{anime.status === 'Finished Airing' ? 'Terminé' : anime.status === 'Currently Airing' ? 'En cours' : anime.status}</span>
              {anime.genres?.map(g => <span key={g.mal_id} className="tag">{g.name}</span>)}
            </div>

            <div className="anime-actions">
              {/* Bouton lecture rapide */}
              <button className="btn-primary" onClick={() => document.getElementById('episodes').scrollIntoView({ behavior: 'smooth' })}>
                ▶ Regarder
              </button>
              <button className="btn-secondary" onClick={toggleWatchlist}>
                {inWatchlist ? '✓ Dans ma liste' : '+ Ajouter à ma liste'}
              </button>
            </div>

            <p className="synopsis">
              {anime.synopsis ? anime.synopsis.slice(0, 450) + (anime.synopsis.length > 450 ? '...' : '') : "Synopsis indisponible"}
            </p>
          </div>
        </div>
      </section>

      {/* EPISODES SECTION */}
      <section className="anime-section" id="episodes">
        <h2>Épisodes</h2>
        {episodesList.length > 0 ? (
          <div className="episodes-grid">
            {episodesList.map(num => (
              <button
                key={num}
                className={`episode-btn ${selectedEpisode === num ? 'active' : ''}`}
                onClick={() => handleEpisodeSelect(num)}
              >
                {num}
              </button>
            ))}
          </div>
        ) : (
          <p>Aucune information sur les épisodes.</p>
        )}
      </section>

      {/* TORRENTS SECTION */}
      {selectedEpisode && (
        <section className="anime-section">
          <h2>Liens pour l'épisode {selectedEpisode}</h2>

          {loadingTorrents && <div className="loader">Recherche des sources...</div>}
          {errorTorrents && <div className="error">{errorTorrents}</div>}

          {!loadingTorrents && !errorTorrents && (
            <div className="torrent-list">
              {torrentResults.torrents.length > 0 && (
                <>
                  <h3 className="subsection-title">Correspondances directes</h3>
                  {torrentResults.torrents.map((t, i) => (
                    <div key={`t-${i}`} className="torrent-item">
                      <div className="torrent-info">
                        <span className="torrent-name">{t.name}</span>
                        <span className="torrent-meta">{t.size} • Seeds: {t.seeds}</span>
                      </div>
                      <button className="play-torrent-btn" onClick={() => handlePlay(t)}>Lecture</button>
                    </div>
                  ))}
                </>
              )}

              {/* Fallback : Candidates */}
              {torrentResults.torrents.length === 0 && torrentResults.candidates.length > 0 && (
                <>
                  <h3 className="subsection-title">Autres résultats (à vérifier)</h3>
                  {torrentResults.candidates.map((t, i) => (
                    <div key={`c-${i}`} className="torrent-item">
                      <div className="torrent-info">
                        <span className="torrent-name">{t.name}</span>
                        <span className="torrent-meta">{t.size} • Seeds: {t.seeds}</span>
                      </div>
                      <button className="play-torrent-btn" onClick={() => handlePlay(t)}>Essayer</button>
                    </div>
                  ))}
                </>
              )}

              {/* Fallback : Batches */}
              {torrentResults.torrents.length === 0 && torrentResults.batches.length > 0 && (
                <>
                  <h3 className="subsection-title">Packs / Saisons Complètes</h3>
                  {torrentResults.batches.map((t, i) => (
                    <div key={`b-${i}`} className="torrent-item">
                      <div className="torrent-info">
                        <span className="torrent-name">{t.name}</span>
                        <span className="torrent-meta">{t.size} • Seeds: {t.seeds}</span>
                      </div>
                      <button className="play-torrent-btn" onClick={() => handlePlay(t)}>Voir</button>
                    </div>
                  ))}
                </>
              )}

              {torrentResults.torrents.length === 0 &&
                torrentResults.candidates.length === 0 &&
                torrentResults.batches.length === 0 && (
                  <p>Aucun lien trouvé. Veuillez réessayer plus tard ou changer d'épisode.</p>
                )}
            </div>
          )}
        </section>
      )}

      <Footer />
    </div>
  );
}
