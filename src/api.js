const API_BASE = "/api";
const JIKAN_API = "https://api.jikan.moe/v4";
const ANILIST_API = "https://graphql.anilist.co";

/**
 * Recherche des animes par titre via l'API Jikan.
 */
export async function searchAnime(query) {
  try {
    const response = await fetch(`${JIKAN_API}/anime?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Erreur lors de la recherche d'anime:", error);
    return [];
  }
}

/**
 * Récupère les détails d'un anime via l'API Jikan.
 */
export async function getAnimeDetails(id) {
  try {
    const response = await fetch(`${JIKAN_API}/anime/${id}`);
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Erreur détails anime:", error);
    throw error;
  }
}

/**
 * Récupère les 20 derniers épisodes sortis (Sorties Récentes)
 * Utilise le calendrier AniList pour la précision.
 */
export async function getRecentAnimes() {
  const query = `
  query {
    Page(page: 1, perPage: 20) {
      airingSchedules(notYetAired: false, sort: TIME_DESC) {
        episode
        media {
          id
          idMal
          title {
            romaji
            english
            native
          }
          coverImage {
            large
            extraLarge
          }
          averageScore
          format
          episodes
        }
      }
    }
  }
  `;

  try {
    const response = await fetch(ANILIST_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({ query })
    });

    const json = await response.json();
    const schedules = json.data.Page.airingSchedules;

    // Mapping pour correspondre au format attendu par AnimeList
    return schedules.map(item => {
      const anime = item.media;
      return {
        mal_id: anime.idMal || anime.id,
        title: anime.title.english || anime.title.romaji,
        images: {
          webp: {
            image_url: anime.coverImage.large
          },
          jpg: {
            image_url: anime.coverImage.large
          }
        },
        score: anime.averageScore ? (anime.averageScore / 10).toFixed(1) : "?",
        type: anime.format,
        episodes: anime.episodes,
        // On ajoute une info "Dernier épisode" pour l'affichage si besoin
        latestEpisode: item.episode 
      };
    });

  } catch (error) {
    console.error("Erreur Recent Animes (AniList):", error);
    return [];
  }
}

/**
 * Récupère les animés de la saison pour le Carrousel (AniList)
 */
export async function getSeasonTopAnime() {
  const query = `
  query {
    Page(page: 1, perPage: 10) {
      media(type: ANIME, sort: TRENDING_DESC, status: RELEASING, isAdult: false) {
        id
        idMal
        title {
          romaji
          english
        }
        bannerImage
        coverImage {
          extraLarge
          large
        }
        description
        averageScore
        seasonYear
        episodes
        format
      }
    }
  }
  `;

  try {
    const response = await fetch(ANILIST_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query })
    });

    const json = await response.json();
    const anilistData = json.data.Page.media;

    return anilistData.map(anime => ({
      mal_id: anime.idMal || anime.id,
      title: anime.title.english || anime.title.romaji,
      bannerImage: anime.bannerImage, 
      images: {
        webp: { large_image_url: anime.coverImage.extraLarge || anime.coverImage.large }
      },
      score: anime.averageScore ? (anime.averageScore / 10).toFixed(1) : "N/A", 
      year: anime.seasonYear,
      episodes: anime.episodes,
      type: anime.format,
      synopsis: anime.description ? anime.description.replace(/<[^>]*>?/gm, '') : ""
    }));

  } catch (error) {
    console.error("Erreur API AniList:", error);
    return [];
  }
}

/**
 * Récupère les torrents (Backend local)
 */
export async function getTorrentResults(title, episode) {
  try {
    const res = await fetch(`${API_BASE}/torrents?anime=${encodeURIComponent(title)}&episode=${episode}`);
    if (!res.ok) throw new Error("Erreur backend");
    const data = await res.json();
    return {
      torrents: data.torrents || [],
      candidates: data.candidates || [],
      batches: data.batches || []
    };
  } catch (e) {
    console.error("Erreur Torrent:", e);
    return { torrents: [], candidates: [], batches: [] };
  }
}