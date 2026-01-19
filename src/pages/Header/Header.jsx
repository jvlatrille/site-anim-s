import React from 'react';
import { Link } from 'react-router-dom';
import SearchBar from '../../components/SearchBar';
import './Header.css';

export default function Header({ onSearch }) {
    return (
        <header className="netflix-header">
            <div className="header-left">
                <div className="logo-area">ANIME-S</div>
                <nav className="main-nav">
                    <Link to="/" className="nav-link active">Accueil</Link>
                    <Link to="/watchlist" className="nav-link">Ma Liste</Link>
                    <Link to="/history" className="nav-link">Historique</Link>
                </nav>
            </div>

            <div className="search-area">
                {/* On passe la fonction de recherche si elle existe, sinon la barre est cachée ou inactive */}
                {onSearch && <SearchBar onSearch={onSearch} />}
            </div>
        </header>
    );
}