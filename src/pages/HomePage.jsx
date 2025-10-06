import React, { useEffect, useState } from "react";
import SearchBar from "../components/SearchBar.jsx";
import AnimeList from "../components/AnimeList.jsx";
import { searchAnime, getTopAnime } from "../api.js";

export default function HomePage() {
  const [results, setResults] = useState([]);
  const [top, setTop] = useState([]);
  const [loadingTop, setLoadingTop] = useState(true);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoadingTop(true);
        const data = await getTopAnime(24);
        if (alive) setTop(data);
      } catch {
        /* ignore */
      } finally {
        if (alive) setLoadingTop(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const handleSearch = async (q) => {
    setLoadingSearch(true);
    setErr("");
    setResults([]);
    try {
      const data = await searchAnime(q);
      setResults(data);
      if (!data || data.length === 0) setErr("Aucun résultat.");
    } catch {
      setErr("Erreur de recherche.");
    } finally {
      setLoadingSearch(false);
    }
  };

  return (
    <div>
      <h1>Anime VOSTFR – Recherche</h1>
      <SearchBar onSearch={handleSearch} />

      {loadingSearch && <p>Recherche…</p>}
      {err && !loadingSearch && <p>{err}</p>}
      {!loadingSearch && results?.length > 0 && (
        <div className="section">
          <h2>Résultats</h2>
          <AnimeList animeList={results} />
        </div>
      )}

      {/* Tendances par défaut si pas de recherche */}
      {results.length === 0 && (
        <div className="section">
          <h2>Tendances</h2>
          {loadingTop ? <p>Chargement…</p> : <AnimeList animeList={top} />}
        </div>
      )}
    </div>
  );
}
