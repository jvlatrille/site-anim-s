/**
 * Service pour gérer la Watchlist et l'Historique via localStorage.
 */

const WATCHLIST_KEY = "anime_watchlist";
const HISTORY_KEY = "anime_history";

export const StorageService = {
    // --- Watchlist ---

    getWatchlist: () => {
        try {
            const data = localStorage.getItem(WATCHLIST_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error("Erreur lecture watchlist:", e);
            return [];
        }
    },

    addToWatchlist: (anime) => {
        const list = StorageService.getWatchlist();
        if (!list.find(i => i.mal_id === anime.mal_id)) {
            list.push(anime);
            localStorage.setItem(WATCHLIST_KEY, JSON.stringify(list));
        }
    },

    removeFromWatchlist: (animeId) => {
        let list = StorageService.getWatchlist();
        list = list.filter(i => i.mal_id !== animeId);
        localStorage.setItem(WATCHLIST_KEY, JSON.stringify(list));
    },

    isInWatchlist: (animeId) => {
        const list = StorageService.getWatchlist();
        return !!list.find(i => i.mal_id === animeId);
    },

    // --- Historique ---

    getHistory: () => {
        try {
            const data = localStorage.getItem(HISTORY_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error("Erreur lecture historique:", e);
            return [];
        }
    },

    /**
     * Ajoute ou met à jour un anime dans l'historique.
     * @param {Object} anime - L'objet anime complet
     * @param {number} episode - Numéro de l'épisode regardé
     * @param {number} timestamp - (Optionnel) Timestamp visionnage
     */
    addToHistory: (anime, episode, timestamp = Date.now()) => {
        let list = StorageService.getHistory();
        // On retire l'ancienne entrée si elle existe pour la remettre en haut de liste
        list = list.filter(i => i.mal_id !== anime.mal_id);
        
        const historyItem = {
            ...anime,
            lastEpisodeWatched: episode,
            lastWatchedAt: timestamp
        };
        
        list.unshift(historyItem); // Ajout au début
        
        // Limite à 50 items pour ne pas surcharger le localStorage
        if (list.length > 50) list = list.slice(0, 50);

        localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
    },

    getContinueWatching: () => {
        // Retourne simplement l'historique complet pour l'instant
        // Idéalement on pourrait filtrer ceux qui ne sont pas "finis"
        return StorageService.getHistory();
    }
};
