import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AnimePage from './pages/AnimePage';
import PlayerPage from './pages/PlayerPage';
import WatchlistPage from './pages/WatchlistPage';
import HistoryPage from './pages/HistoryPage';

function App() {
  return (
    <div className="container">
      <nav>
        <Link to="/">Accueil</Link>{' '}
        <Link to="/watchlist">Watchlist</Link>{' '}
        <Link to="/history">Historique</Link>
      </nav>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/anime/:id" element={<AnimePage />} />
        <Route path="/player" element={<PlayerPage />} />
        <Route path="/watchlist" element={<WatchlistPage />} />
        <Route path="/history" element={<HistoryPage />} />
      </Routes>
    </div>
  );
}

export default App;
