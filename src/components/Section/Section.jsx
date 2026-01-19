import React from 'react';
import './Section.css';

export default function Section({ title, children, className = "" }) {
    if (!children) return null;

    return (
        <section className={`home-section ${className}`}>
            {title && <h2 className="section-title">{title}</h2>}
            <div className="section-content">
                {children}
            </div>
        </section>
    );
}
