import React from "react";
import { Routes, Route } from "react-router-dom";

// Imports des NOUVELLES pages
import Home from "./pages/Home/Home";
// import Anime from "./pages/Anime/Anime"; // À faire après
// import Player from "./pages/Player/Player"; // À faire après
import WatchlistPage from "./pages/WatchlistPage"; // Ancienne version pour l'instant
import HistoryPage from "./pages/HistoryPage";     // Ancienne version pour l'instant

import "./App.css"; // Styles globaux (reset, variables)

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/watchlist" element={<WatchlistPage />} />
      <Route path="/history" element={<HistoryPage />} />
      {/* <Route path="/anime/:id" element={<Anime />} /> */}
      {/* <Route path="/player" element={<Player />} /> */}
    </Routes>
  );
}