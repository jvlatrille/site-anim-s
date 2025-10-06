import React, { useEffect, useState } from 'react';
import Watchlist from '../components/Watchlist';

function WatchlistPage() {
  const [watchlist, setWatchlist] = useState([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('watchlist');
      if (stored) {
        setWatchlist(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Erreur lors de la récupération de la watchlist", e);
    }
  }, []);

  const handleRemove = (animeId) => {
    try {
      const stored = localStorage.getItem('watchlist');
      let list = stored ? JSON.parse(stored) : [];
      list = list.filter(item => item.mal_id !== animeId);
      localStorage.setItem('watchlist', JSON.stringify(list));
      setWatchlist(list);
    } catch (e) {
      console.error("Erreur lors de la mise à jour de la watchlist", e);
    }
  };

  return (
    <div>
      <h2>Ma Watchlist</h2>
      {watchlist.length === 0 ? (
        <p>Aucun anime dans la watchlist.</p>
      ) : (
        <Watchlist items={watchlist} onRemove={handleRemove} />
      )}
    </div>
  );
}

export default WatchlistPage;
