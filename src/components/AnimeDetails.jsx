import React from 'react';

function AnimeDetails({ anime, onAddWatchlist }) {
  if (!anime) return null;

  const {
    images,
    title,
    type,
    episodes,
    status,
    score,
    synopsis
  } = anime;

  // Statut en français
  let statusFr = status;
  if (status === 'Finished Airing') statusFr = 'Terminé';
  else if (status === 'Currently Airing') statusFr = 'En cours';
  else if (status === 'Not yet aired') statusFr = 'À venir';

  return (
    <div className="anime-details">
      <div className="anime-details-header">
        <img 
          src={images.jpg.large_image_url || images.jpg.image_url} 
          alt={title} 
          className="anime-cover" 
        />
        <div className="anime-info">
          <h2>{title}</h2>
          <p className="anime-info-meta">
            {type && <span>Type : {type}</span>}
            {episodes ? (
              <span> | Épisodes : {episodes}</span>
            ) : (
              <span> | Épisodes : ?</span>
            )}
            {status && <span> | Statut : {statusFr}</span>}
            {score && <span> | Score : {score}</span>}
          </p>
          {onAddWatchlist && (
            <button 
              className="add-watchlist-btn" 
              onClick={() => onAddWatchlist(anime)}
            >
              Ajouter à la Watchlist
            </button>
          )}
        </div>
      </div>
      <div className="anime-synopsis">
        <h3>Synopsis</h3>
        <p>{synopsis || 'Aucun synopsis disponible.'}</p>
      </div>
    </div>
  );
}

export default AnimeDetails;
