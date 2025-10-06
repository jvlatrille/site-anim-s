import React, { useRef, useState } from 'react';

function VideoPlayer({ src }) {
  const videoRef = useRef(null);
  const [loading, setLoading] = useState(true);

  const handleCanPlay = () => {
    setLoading(false);
  };

  const handleWaiting = () => {
    setLoading(true);
  };

  return (
    <div className="video-player">
      {loading && <p>Chargement de la vidéo...</p>}
      <video
        ref={videoRef}
        src={src}
        controls
        autoPlay
        onCanPlay={handleCanPlay}
        onWaiting={handleWaiting}
      />
    </div>
  );
}

export default VideoPlayer;
