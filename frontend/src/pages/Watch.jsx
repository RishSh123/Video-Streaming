import React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchVideoDetails } from "../utils/videoApi";
import VideoPlayer from "../components/VideoPlayer";
import apiClient from "../utils/api";

export default function Watch() {
  const { videoId } = useParams();
  const navigate = useNavigate();

  // Query 1: Fetch individual stream details from the backend database
  const { data: video, isLoading, isError, error } = useQuery({
    queryKey: ["watchVideo", videoId],
    queryFn: () => fetchVideoDetails(videoId),
  });

  // Query 2: Fetch corresponding categories recommendations stack
  const { data: relatedVideos } = useQuery({
    queryKey: ["relatedVideos", videoId],
    queryFn: async () => {
      const response = await apiClient.get(`/videos/v/${videoId}/related`);
      return response.data.data;
    },
    enabled: !!videoId,
  });

  // Configure options to cleanly handle ImageKit's adaptive HLS format
  const videoJsOptions = {
    autoplay: true,
    controls: true,
    responsive: true,
    fluid: true,
    poster: video?.thumbnailUrl,
    sources: [
      {
        src: video?.videoUrl,
        type: "application/x-mpegURL", // ◄── Forces Video.js to activate its HLS streaming engine
      },
    ],
  };

  const handlePlayerReady = (player) => {
    // Optional placeholder hook for analytic tracking or playback logging events
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 bg-rose-950/20 border border-rose-900/40 rounded-xl text-rose-400 text-xs text-center">
        Error loading multimedia viewport: {error.message}
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto p-4 text-white">
      
      {/* LEFT COMPONENT COLUMN: Main Cinematic Player Frame Workspace */}
      <div className="flex-1 space-y-4 overflow-hidden">
        
        {/* Responsive Aspect-Video Box Mounting the Player */}
        <div className="aspect-video w-full rounded-2xl bg-black border border-slate-800/40 overflow-hidden shadow-2xl relative">
          {video?.videoUrl && (
            <VideoPlayer options={videoJsOptions} onReady={handlePlayerReady} />
          )}
        </div>

        {/* Video Text Metadata Layout */}
        <div className="space-y-2.5 px-1">
          <h1 className="text-lg md:text-xl font-extrabold tracking-tight leading-snug text-slate-100">
            {video?.title}
          </h1>
          
          <div className="text-[11px] text-slate-400 font-semibold border-b border-slate-800/50 pb-3">
            {video?.views} views &bull; {new Date(video?.createdAt).toLocaleDateString()}
          </div>

          {/* Publisher Metadata Card */}
          <div className="flex gap-3 items-center pt-2">
            <Link 
              to={`/c/${video?.owner?.username}`}
              className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700/30 overflow-hidden shrink-0 flex items-center justify-center shadow-md"
            >
              {video?.owner?.avatar && video.owner.avatar.startsWith("http") ? (
                <img src={video.owner.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <svg className="w-6 h-6 text-slate-400 mt-1" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                </svg>
              )}
            </Link>
            
            <div className="overflow-hidden">
              <Link to={`/c/${video?.owner?.username}`} className="text-xs font-bold block hover:text-indigo-400 transition-colors">
                {video?.owner?.fullName || "Channel Operator"}
              </Link>
              <p className="text-[10px] text-slate-400 font-medium">@{video?.owner?.username}</p>
            </div>
          </div>

          {/* Context Summary Box */}
          <div className="p-4 bg-slate-900/40 border border-slate-800/60 rounded-2xl text-xs font-medium leading-relaxed mt-4 text-slate-300">
            <p className="whitespace-pre-wrap">{video?.description}</p>
            {video?.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {video.tags.map((tag, idx) => (
                  <span key={idx} className="text-[10px] bg-indigo-950/50 text-indigo-400 border border-indigo-900/40 px-2 py-0.5 rounded-md font-bold">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT COMPONENT COLUMN: Recommendation Feed Sidebar */}
      <div className="w-full lg:w-[350px] shrink-0 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 px-1">Related Streams</h3>
        {(!relatedVideos || relatedVideos.length === 0) ? (
          <div className="text-[11px] text-slate-500 italic p-4 text-center bg-slate-900/20 border border-dashed border-slate-800/40 rounded-2xl">
            No similar recommendations compiled for this stream category.
          </div>
        ) : (
          <div className="space-y-3.5">
            {relatedVideos.map((item) => (
              <div 
                key={item._id}
                onClick={() => navigate(`/watch/${item._id}`)}
                className="group flex gap-3 cursor-pointer p-1 rounded-xl hover:bg-slate-900/30 transition-colors"
              >
                <div className="w-32 aspect-video rounded-xl bg-slate-800 border border-slate-800/40 overflow-hidden shrink-0 relative">
                  <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" />
                </div>
                <div className="space-y-0.5 min-w-0 flex flex-col justify-center">
                  <h4 className="text-[11px] font-bold leading-tight line-clamp-2 text-slate-200 group-hover:text-indigo-400 transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                    {item.owner?.fullName || "Channel Operator"}
                  </p>
                  <p className="text-[9px] text-slate-500 font-medium">{item.views} views</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}