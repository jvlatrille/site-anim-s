import React, { useEffect, useState } from 'react';
import History from '../components/History';

function HistoryPage() {
  const [historyItems, setHistoryItems] = useState([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('history');
      if (stored) {
        setHistoryItems(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Erreur lors de la récupération de l'historique", e);
    }
  }, []);

  return (
    <div>
      <h2>Historique</h2>
      {historyItems.length === 0 ? (
        <p>Aucun historique pour le moment.</p>
      ) : (
        <History historyItems={historyItems} />
      )}
    </div>
  );
}

export default HistoryPage;
