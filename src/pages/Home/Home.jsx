import React, { useEffect, useState, useCallback } from "react";
import Header from "../Header/Header";
import Footer from "../Footer/Footer";
import HeroCarousel from "../../components/HeroCarousel";
import AnimeList from "../../components/AnimeList";
import Section from "../../components/Section/Section";
import { searchAnime, getSeasonTopAnime, getRecentAnimes } from "../../api";
import { StorageService } from "../../services/storage";
import './Home.css';

export default function Home() {
    const [results, setResults] = useState([]);

    // Data states
    const [featuredList, setFeaturedList] = useState([]);
    const [recentList, setRecentList] = useState([]);

    // User lists (LocalStorage)
    const [history, setHistory] = useState([]);
    const [watchlist, setWatchlist] = useState([]);

    const [loadingRecent, setLoadingRecent] = useState(true);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [err, setErr] = useState("");

    // Charge les données de l'API (une seule fois)
    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                setLoadingRecent(true);
                const [seasonData, recentData] = await Promise.all([
                    getSeasonTopAnime(),
                    getRecentAnimes()
                ]);

                if (alive) {
                    setFeaturedList(seasonData);
                    setRecentList(recentData);
                }
            } catch (e) {
                console.error(e);
            } finally {
                if (alive) setLoadingRecent(false);
            }
        })();
        return () => { alive = false; };
    }, []);

    // Charge les données locales (Watchlist/History)
    const loadUserData = useCallback(() => {
        setHistory(StorageService.getContinueWatching());
        setWatchlist(StorageService.getWatchlist());
    }, []);

    useEffect(() => {
        loadUserData();
        // Optionnel: écouter les changements de focus pour rafraîchir si l'utilisateur revient d'un épisode
        window.addEventListener('focus', loadUserData);
        return () => window.removeEventListener('focus', loadUserData);
    }, [loadUserData]);

    const handleSearch = async (q) => {
        setLoadingSearch(true);
        setSearchQuery(q);
        setErr("");
        setResults([]);
        try {
            const data = await searchAnime(q);
            setResults(data);
            if (!data || data.length === 0) setErr("Aucun résultat.");
        } catch { setErr("Erreur recherche."); }
        finally { setLoadingSearch(false); }
    };

    return (
        <div className="home-container">
            <Header onSearch={handleSearch} />

            <main>
                {searchQuery ? (
                    <div className="section-results">
                        <h2>Résultats pour "{searchQuery}"</h2>
                        {loadingSearch && <div className="loader">Recherche...</div>}
                        {err && <div className="error">{err}</div>}
                        <AnimeList animeList={results} />
                    </div>
                ) : (
                    <>
                        {/* Carrousel Principal */}
                        <HeroCarousel animes={featuredList} />

                        {/* 1. Reprendre la lecture (Historique) */}
                        {history.length > 0 && (
                            <Section title="Reprendre la lecture">
                                <AnimeList
                                    animeList={history.slice(0, 10)}
                                    direction="row"
                                    showProgress={true}
                                />
                            </Section>
                        )}

                        {/* 2. Ma Liste (Watchlist) */}
                        {watchlist.length > 0 && (
                            <Section title="Ma Liste">
                                <AnimeList
                                    animeList={watchlist}
                                    direction="row"
                                    // On passe une fonction pour rafraîchir si on retire un élément
                                    key={watchlist.length} // Force re-render simple
                                />
                            </Section>
                        )}

                        {/* 3. Dernières Sorties */}
                        <Section title="Dernières Sorties d'Épisodes">
                            {loadingRecent ? (
                                <div className="loader">Chargement...</div>
                            ) : (
                                <AnimeList animeList={recentList} direction="row" />
                            )}
                        </Section>

                        {/* 4. Tendances de la saison (reste de la liste featured) */}
                        <Section title="Tendances de la Saison">
                            <AnimeList animeList={featuredList} direction="grid" />
                        </Section>
                    </>
                )}
            </main>

            <Footer />
        </div>
    );
}