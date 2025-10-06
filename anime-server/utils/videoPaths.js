import path from "path";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import ffprobeBin from "@ffprobe-installer/ffprobe";

ffmpeg.setFfmpegPath(ffmpegStatic);
ffmpeg.setFfprobePath(ffprobeBin.path);

// retourne { videoFileAbs, torrentPath }
export function getVideoAbsolutePath(torrent, file) {
  // WebTorrent en mode Node écrit sur disque (path = dossier de DL)
  // file.path est relatif au torrent
  const torrentPath = torrent.path || path.dirname(file.path);
  const abs = path.isAbsolute(file.path)
    ? file.path
    : path.join(torrentPath, file.path);
  return { videoFileAbs: abs, torrentPath };
}

export { ffmpeg };
