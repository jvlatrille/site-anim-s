import React from 'react';

function TorrentResults({ results, onPlay }) {
  return (
    <div className="torrent-results">
      {results.length === 0 ? (
        <p>Aucun résultat.</p>
      ) : (
        <ul>
          {results.map((t, i) => (
            <li key={i} className="torrent-item">
              <span className="torrent-name">{t.name}</span>
              <span className="torrent-meta">
                {typeof t.seeds === 'number' ? `Seeds: ${t.seeds}` : ''}
                {t.size ? ` • ${t.size}` : ''}
                {t.source ? ` • ${t.source}` : ''}
              </span>
              {onPlay && (t.magnet || t.torrentUrl) ? (
                <button className="torrent-play-btn" onClick={() => onPlay(t)}>
                  Lecture
                </button>
              ) : (
                <a href={t.pageLink || t.torrentUrl} target="_blank" rel="noreferrer">
                  Ouvrir la page
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default TorrentResults;
