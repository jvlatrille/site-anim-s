/**
 * Recherche des animes par titre via l'API Jikan.
 */
export async function searchAnime(query) {
  try {
    const response = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Erreur lors de la recherche d'anime:", error);
    throw error;
  }
}

/**
 * Récupère les détails d'un anime (titre, synopsis, etc.) via l'API Jikan.
 */
export async function getAnimeDetails(id) {
  try {
    const response = await fetch(`https://api.jikan.moe/v4/anime/${id}`);
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Erreur lors de la récupération des détails de l'anime:", error);
    throw error;
  }
}

/**
 * Récupère la liste des torrents pour un anime et un numéro d'épisode via le backend.
 */
export async function getTorrentResults(title, episode) {
  const res = await fetch(`/api/torrents?anime=${encodeURIComponent(title)}&episode=${episode}`);
  const data = await res.json();
  // Normalise pour le composant
  return {
    torrents: data.torrents || [],
    candidates: data.candidates || [],
    batches: data.batches || []
  };
}


export async function getTopAnime(limit = 24) {
  const r = await fetch(`https://api.jikan.moe/v4/top/anime?limit=${limit}&sfw=true`);
  const j = await r.json();
  return j.data || [];
}