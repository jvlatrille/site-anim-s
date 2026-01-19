import React from "react";
import { Routes, Route } from "react-router-dom";

// Imports des NOUVELLES pages
import Home from "./pages/Home/Home";
import WatchlistPage from "./pages/WatchlistPage";
import HistoryPage from "./pages/HistoryPage";
import AnimePage from "./pages/AnimePage/AnimePage";
import PlayerPage from "./pages/PlayerPage";

import "./App.css"; // Styles globaux (reset, variables)

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/watchlist" element={<WatchlistPage />} />
      <Route path="/history" element={<HistoryPage />} />
      <Route path="/anime/:id" element={<AnimePage />} />
      <Route path="/player" element={<PlayerPage />} />
    </Routes>
  );
}