import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { StorageService } from '../../services/storage';
import './AnimeCard.css';

export default function AnimeCard({ anime, showProgress = false, refreshWatchlist }) {
    const [inWatchlist, setInWatchlist] = useState(false);

    useEffect(() => {
        setInWatchlist(StorageService.isInWatchlist(anime.mal_id));
    }, [anime.mal_id]);

    const toggleWatchlist = (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (inWatchlist) {
            StorageService.removeFromWatchlist(anime.mal_id);
            setInWatchlist(false);
        } else {
            StorageService.addToWatchlist(anime);
            setInWatchlist(true);
        }

        // Callback pour rafraîchir la liste parente si nécessaire
        if (refreshWatchlist) refreshWatchlist();
    };

    const img = anime.images?.jpg?.image_url || anime.images?.webp?.image_url;

    return (
        <div className="anime-card">
            <Link to={`/anime/${anime.mal_id}`} className="anime-card-link">
                <div className="anime-card-poster">
                    <img src={img} alt={anime.title} loading="lazy" />

                    {/* Overlay au survol */}
                    <div className="anime-card-overlay">
                        <button
                            className={`watchlist-btn ${inWatchlist ? 'active' : ''}`}
                            onClick={toggleWatchlist}
                            title={inWatchlist ? "Retirer de la watchlist" : "Ajouter à la watchlist"}
                        >
                            {inWatchlist ? '✓' : '+'}
                        </button>
                        <div className="play-icon">▶</div>
                    </div>

                    {/* Barre de progression (si applicable) */}
                    {showProgress && anime.lastEpisodeWatched && (
                        <div className="progress-bar-container">
                            <div className="progress-text">Ep. {anime.lastEpisodeWatched}</div>
                            {/* Simulation barre de progression */}
                            <div className="progress-track">
                                <div className="progress-fill" style={{ width: '50%' }}></div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="anime-card-info">
                    <div className="anime-title" title={anime.title}>{anime.title}</div>
                    <p className="anime-meta">
                        {anime.type === 'TV' ? 'Série' : anime.type}
                        {anime.episodes ? ` • ${anime.episodes} eps` : ''}
                    </p>
                </div>
            </Link>
        </div>
    );
}
