import React from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, EffectFade, Navigation } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';
import 'swiper/css/navigation';

import './HeroCarousel.css';

export default function HeroCarousel({ animes }) {
    if (!animes || animes.length === 0) return null;

    return (
        <div className="hero-wrapper">
            <Swiper
                modules={[Autoplay, Pagination, EffectFade, Navigation]}
                effect="fade"
                speed={1000}
                navigation={true}
                loop={true}
                autoplay={{
                    delay: 6000,
                    disableOnInteraction: false,
                }}
                pagination={{
                    clickable: true,
                    dynamicBullets: true
                }}
                className="hero-swiper"
            >
                {animes.map((anime) => {
                    // 1. Fond : Bannière AniList ou Trailer Jikan
                    const bannerImage =
                        anime.bannerImage ||
                        anime.trailer?.images?.maximum_image_url ||
                        anime.images?.webp?.large_image_url;

                    // 2. Affiche : Le poster vertical officiel
                    const posterImage = anime.images?.webp?.image_url;

                    return (
                        <SwiperSlide key={anime.mal_id}>
                            <div className="hero-slide-content">

                                {/* IMAGE DE FOND (Ambiance) */}
                                <div
                                    className="hero-backdrop"
                                    style={{ backgroundImage: `url(${bannerImage})` }}
                                />

                                {/* DÉGRADÉ */}
                                <div className="hero-gradient" />

                                {/* CONTENEUR PRINCIPAL */}
                                <div className="hero-info-container">
                                    <div className="hero-info-glass">

                                        {/* COLONNE GAUCHE : Texte */}
                                        <div className="hero-text-content">
                                            <h1 className="hero-title">{anime.title}</h1>

                                            <div className="hero-meta">
                                                {anime.score && <span className="match-score">★ {anime.score}</span>}
                                                <span className="year">{anime.year || 'En cours'}</span>
                                                <span className="type-badge">{anime.type}</span>
                                            </div>

                                            <p className="hero-synopsis">
                                                {anime.synopsis
                                                    ? anime.synopsis.slice(0, 150) + "..."
                                                    : "Synopsis indisponible."}
                                            </p>

                                            <div className="hero-actions">
                                                <Link to={`/anime/${anime.mal_id}`} className="btn btn-play">
                                                    ▶ Lecture
                                                </Link>
                                                <button className="btn btn-details">
                                                    ℹ Plus d'infos
                                                </button>
                                            </div>
                                        </div>

                                        {/* COLONNE DROITE : Affiche */}
                                        <div className="hero-poster-wrapper">
                                            <img src={posterImage} alt={anime.title} className="hero-poster-img" />
                                        </div>

                                    </div>
                                </div>

                            </div>
                        </SwiperSlide>
                    );
                })}
            </Swiper>
        </div>
    );
}