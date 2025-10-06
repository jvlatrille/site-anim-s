import React from 'react';
import { Link } from 'react-router-dom';

function Watchlist({ items, onRemove }) {
  return (
    <div className="anime-list">
      {items.map((anime) => (
        <div key={anime.mal_id} className="anime-item">
          <Link to={`/anime/${anime.mal_id}`}>
            <img src={anime.images.jpg.image_url} alt={anime.title} />
            <h3 className="anime-title">{anime.title}</h3>
          </Link>
          <button 
            className="remove-btn" 
            onClick={() => onRemove(anime.mal_id)}
          >
            Supprimer
          </button>
        </div>
      ))}
    </div>
  );
}

export default Watchlist;
