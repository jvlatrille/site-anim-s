import React, { useEffect, useState, useCallback } from 'react';
import AnimeList from '../components/AnimeList';
import Header from './Header/Header';
import Footer from './Footer/Footer';
import { StorageService } from '../services/storage';

function WatchlistPage() {
  const [watchlist, setWatchlist] = useState([]);

  const loadWatchlist = useCallback(() => {
    setWatchlist(StorageService.getWatchlist());
  }, []);

  useEffect(() => {
    loadWatchlist();
  }, [loadWatchlist]);

  return (
    <div className="page-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <main style={{ flex: 1, padding: '20px 4%' }}>
        <h2 style={{ color: 'white', marginBottom: '20px' }}>Ma Watchlist</h2>
        {watchlist.length === 0 ? (
          <p style={{ color: '#aaa' }}>Aucun anime dans la watchlist.</p>
        ) : (
          <AnimeList
            animeList={watchlist}
            direction="grid"
            refreshWatchlist={loadWatchlist} // Pass callback to refresh UI on remove
          />
        )}
      </main>
      <Footer />
    </div>
  );
}

export default WatchlistPage;
