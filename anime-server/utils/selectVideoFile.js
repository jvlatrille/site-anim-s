// Sélectionne le meilleur fichier vidéo d'un torrent (mp4 ou mkv le plus gros)
export function selectVideoFile(torrent) {
  if (!torrent || !Array.isArray(torrent.files)) return null;
  const vids = torrent.files.filter(f => {
    const n = f.name.toLowerCase();
    return n.endsWith(".mp4") || n.endsWith(".mkv");
  });
  if (vids.length === 0) return null;
  // prend le plus gros
  vids.sort((a, b) => b.length - a.length);
  return vids[0];
}
