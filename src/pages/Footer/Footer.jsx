import React from 'react';
import './Footer.css';

export default function Footer() {
    return (
        <footer className="netflix-footer">
            <div className="footer-content">
                <p>Anime-S • Fait avec ❤️ par moi</p>
                <p className="footer-links">
                    <span>Confidentialité</span>
                    <span>Conditions d'utilisation</span>
                    <span>Nous contacter</span>
                </p>
            </div>
        </footer>
    );
}