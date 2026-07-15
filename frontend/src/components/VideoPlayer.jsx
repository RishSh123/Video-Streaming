import React, { useEffect, useRef } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";

export default function VideoPlayer({ options, onReady }) {
  const videoRef = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => {
    // 1. Make sure Video.js initializes only once on initial mount
    if (!playerRef.current) {
      const videoElement = document.createElement("video-js");
      
      // Centers the big play button and makes the player fluidly responsive
      videoElement.classList.add("vjs-big-play-centered", "vjs-fluid");
      videoRef.current.appendChild(videoElement);

      const player = (playerRef.current = videojs(videoElement, options, () => {
        videojs.log("Player initialized successfully");
        onReady && onReady(player);
      }));
    } else {
      // 2. If options alter later (like navigating to a new video), update the instance
      const player = playerRef.current;
      player.autoplay(options.autoplay);
      player.src(options.sources);
    }
  }, [options, videoRef]);

  // 3. Clean up and completely dispose of the player instance when unmounting
  useEffect(() => {
    const player = playerRef.current;

    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, []);

  return (
    <div data-vjs-player className="w-full h-full rounded-2xl overflow-hidden bg-black">
      <div ref={videoRef} className="w-full h-full" />
    </div>
  );
}