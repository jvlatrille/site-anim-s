import React, { useEffect, useState } from 'react';
import AnimeList from '../components/AnimeList';
import Header from './Header/Header';
import Footer from './Footer/Footer';
import { StorageService } from '../services/storage';

function HistoryPage() {
  const [historyItems, setHistoryItems] = useState([]);

  useEffect(() => {
    setHistoryItems(StorageService.getHistory());
  }, []);

  return (
    <div className="page-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <main style={{ flex: 1, padding: '20px 4%' }}>
        <h2 style={{ color: 'white', marginBottom: '20px' }}>Historique</h2>
        {historyItems.length === 0 ? (
          <p style={{ color: '#aaa' }}>Aucun historique pour le moment.</p>
        ) : (
          <AnimeList
            animeList={historyItems}
            direction="grid"
            showProgress={true}
          />
        )}
      </main>
      <Footer />
    </div>
  );
}

export default HistoryPage;
