import React from 'react';
import { Link } from 'react-router-dom';

export default function AnimeList({ animeList }) {
  if (!animeList || animeList.length === 0) return null;
  return (
    <div className="anime-list">
      {animeList.map((anime) => {
        const img = anime.images?.jpg?.image_url || anime.images?.webp?.image_url;
        return (
          <div key={anime.mal_id} className="anime-item">
            <Link to={`/anime/${anime.mal_id}`} style={{textDecoration:'none', color:'inherit'}}>
              <img src={img} alt={anime.title} />
              <h3 className="anime-title">{anime.title}</h3>
              <p className="anime-meta">
                {anime.type || 'Anime'}
                {anime.episodes ? ` • ${anime.episodes} ép.` : '' }
                {typeof anime.score === 'number' ? ` • ★ ${anime.score}` : ''}
              </p>
            </Link>
          </div>
        );
      })}
    </div>
  );
}
