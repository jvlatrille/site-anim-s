import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";
import AnimePage from "./pages/AnimePage.jsx";
import PlayerPage from "./pages/PlayerPage.jsx";
import WatchlistPage from "./pages/WatchlistPage.jsx";
import HistoryPage from "./pages/HistoryPage.jsx";

export default function App() {
  return (
    <div className="container">
      <nav>
        <Link to="/">Accueil</Link>{" "}
        <Link to="/watchlist">Watchlist</Link>{" "}
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
