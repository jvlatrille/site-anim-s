import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AnimeDetails from '../components/AnimeDetails';
import TorrentResults from '../components/TorrentResults';
import { getAnimeDetails, getTorrentResults } from '../api';

function AnimePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [anime, setAnime] = useState(null);
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [torrentResults, setTorrentResults] = useState({ torrents:[], candidates:[], batches:[] });
  const [loadingAnime, setLoadingAnime] = useState(false);
  const [loadingTorrents, setLoadingTorrents] = useState(false);
  const [errorAnime, setErrorAnime] = useState('');
  const [errorTorrents, setErrorTorrents] = useState('');

  useEffect(() => {
    const fetchAnime = async () => {
      try {
        const data = await getAnimeDetails(id);
        setAnime(data);
      } catch (err) {
        setErrorAnime("Impossible de charger les détails de l'anime.");
      } finally {
        setLoadingAnime(false);
      }
    };
    // Réinitialiser l'état lors du changement d'ID (nouvel anime)
    setAnime(null);
    setSelectedEpisode(null);
    setTorrentResults([]);
    setErrorAnime('');
    setErrorTorrents('');
    setLoadingTorrents(false);
    setLoadingAnime(true);
    fetchAnime();
  }, [id]);

const handleEpisodeSelect = async (episodeNumber) => {
  if (!anime) return;
  setSelectedEpisode(episodeNumber);
  setTorrentResults({ torrents:[], candidates:[], batches:[] });
  setErrorTorrents('');
  try {
    setLoadingTorrents(true);
    const res = await getTorrentResults(anime.title, episodeNumber);
    setTorrentResults(res);
    if (
      res.torrents.length === 0 &&
      res.candidates.length === 0 &&
      res.batches.length === 0
    ) {
      setErrorTorrents('Aucun torrent trouvé pour cet épisode.');
    }
  } catch (err) {
    setErrorTorrents("Erreur lors de la récupération des torrents.");
  } finally {
    setLoadingTorrents(false);
  }
};

  const handlePlay = (torrent) => {
    navigate('/player', {
      state: {
        magnet: torrent.magnet || null,
        torrentUrl: torrent.torrentUrl || null,
        animeId: anime.mal_id,
        animeTitle: anime.title,
        episode: selectedEpisode,
        image: anime.images.jpg.image_url
      }
    });
  };

  const handleAddWatchlist = (animeObj) => {
    try {
      let watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
      if (!watchlist.some(item => item.mal_id === animeObj.mal_id)) {
        watchlist.push(animeObj);
        localStorage.setItem('watchlist', JSON.stringify(watchlist));
        alert('Ajouté à la watchlist');
      } else {
        alert('Cet anime est déjà dans la watchlist');
      }
    } catch (e) {
      console.error("Erreur lors de l'ajout à la watchlist", e);
    }
  };

  const totalEpisodes = anime?.episodes || 0;
  const episodesList = totalEpisodes > 0 
    ? [...Array(totalEpisodes).keys()].map(i => i + 1) 
    : [];

  return (
    <div>
      {loadingAnime && <p>Chargement des détails...</p>}
      {errorAnime && <p>{errorAnime}</p>}
      {anime && !loadingAnime && (
        <AnimeDetails anime={anime} onAddWatchlist={handleAddWatchlist} />
      )}

      {anime && !loadingAnime && episodesList.length > 0 && (
        <div className="episodes-list">
          <h3>Épisodes disponibles</h3>
          <div className="episode-buttons">
            {episodesList.map((num) => (
              <button
                key={num}
                className={`episode-btn ${num === selectedEpisode ? 'active' : ''}`}
                onClick={() => handleEpisodeSelect(num)}
              >
                Épisode {num}
              </button>
            ))}
          </div>
        </div>
      )}

{selectedEpisode && (
  <div className="torrent-section">
    {loadingTorrents && <p>Chargement des torrents...</p>}
    {errorTorrents && !loadingTorrents && <p>{errorTorrents}</p>}

    {!loadingTorrents && !errorTorrents && (
      <>
        {torrentResults.torrents.length > 0 && (
          <>
            <h3>Correspondances</h3>
            <TorrentResults results={torrentResults.torrents} onPlay={handlePlay} />
          </>
        )}

        {torrentResults.torrents.length === 0 && torrentResults.candidates.length > 0 && (
          <>
            <h3>Candidats (à vérifier)</h3>
            <TorrentResults results={torrentResults.candidates} onPlay={handlePlay} />
          </>
        )}

        {torrentResults.torrents.length === 0 && torrentResults.batches.length > 0 && (
          <>
            <h3>Packs / Saisons (fallback)</h3>
            <TorrentResults results={torrentResults.batches} onPlay={handlePlay} />
          </>
        )}
      </>
    )}
  </div>
)}

    </div>
  );
}

export default AnimePage;
