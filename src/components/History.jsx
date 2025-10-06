import React from 'react';
import { Link } from 'react-router-dom';

function History({ historyItems }) {
  return (
    <ul className="history-list">
      {historyItems.map((entry, index) => (
        <li key={index} className="history-item">
          {entry.image && <img src={entry.image} alt={entry.animeTitle} />}
          <div className="history-details">
            <p>
              <Link to={`/anime/${entry.animeId}`}>{entry.animeTitle}</Link> – Épisode {entry.episode}
            </p>
            <p className="history-date">
              {new Date(entry.date).toLocaleString('fr-FR')}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default History;
