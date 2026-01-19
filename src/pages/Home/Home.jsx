import React, { useEffect, useState } from "react";
import Header from "../Header/Header";
import Footer from "../Footer/Footer";
import HeroCarousel from "../../components/HeroCarousel";
import AnimeList from "../../components/AnimeList";
import { searchAnime, getSeasonTopAnime, getRecentAnimes } from "../../api"; // <--- getRecentAnimes importé
import './Home.css';

export default function Home() {
    const [results, setResults] = useState([]);
    const [recentList, setRecentList] = useState([]); // Renommé pour plus de clarté
    const [featuredList, setFeaturedList] = useState([]);

    const [loadingRecent, setLoadingRecent] = useState(true);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [err, setErr] = useState("");

    // Chargement des données
    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                setLoadingRecent(true);

                // 1. Carrousel : Top de la saison (AniList)
                const seasonData = await getSeasonTopAnime();

                // 2. Liste du bas : Sorties Récentes (AniList Schedule)
                const recentData = await getRecentAnimes();

                if (alive) {
                    if (seasonData.length > 0) setFeaturedList(seasonData);
                    if (recentData.length > 0) setRecentList(recentData);
                }
            } catch (e) {
                console.error(e);
            } finally {
                if (alive) setLoadingRecent(false);
            }
        })();
        return () => { alive = false; };
    }, []);

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
                        {/* Carrousel : Tendances Saison */}
                        <HeroCarousel animes={featuredList} />

                        {/* Liste du bas : Derniers épisodes sortis */}
                        <div className="section-trends">
                            <h3>Dernières Sorties d'Épisodes</h3>
                            {loadingRecent ? (
                                <div className="loader">Chargement des sorties...</div>
                            ) : (
                                <AnimeList animeList={recentList} />
                            )}
                        </div>
                    </>
                )}
            </main>

            <Footer />
        </div>
    );
}