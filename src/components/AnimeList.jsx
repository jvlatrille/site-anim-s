import React from 'react';
import AnimeCard from './AnimeCard/AnimeCard';
import './AnimeList.css';

export default function AnimeList({ animeList, direction = 'grid', showProgress = false }) {
  if (!animeList || animeList.length === 0) return null;

  return (
    <div className={`anime-list ${direction}`}>
      {animeList.map((anime) => (
        <AnimeCard
          key={anime.mal_id}
          anime={anime}
          showProgress={showProgress}
        />
      ))}
    </div>
  );
}
