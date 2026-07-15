import React from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchHomeVideos } from "../utils/videoApi";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();
  const formatDuration = (seconds) => {
  if (!seconds || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
};
  
  // React Query hooks handles storage caching & synchronization tasks effortlessly
  const { data: videos, isLoading, isError, error } = useQuery({
    queryKey: ["homeVideos"],
    queryFn: fetchHomeVideos,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 bg-rose-950/20 border border-rose-900/40 rounded-xl text-rose-400 text-xs text-center">
        Failed to sync dashboard feed: {error.message || "Unknown communication fault"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Recommended Streams</h2>
        <p className="text-xs text-slate-400 mt-0.5">Explore fresh distribution content feeds curated for you.</p>
      </div>

      {videos?.length === 0 ? (
        <div className="text-center py-12 text-xs text-slate-500">
          No video distributions found in the network database.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {videos?.map((video) => (
            <div 
              key={video._id} 
              onClick={() => navigate(`/watch/${video._id}`)}
              className="group flex flex-col space-y-2.5 cursor-pointer"
            >
              {/* Media Thumbnail Grid Wrapper */}
              <div className="aspect-video w-full rounded-2xl bg-slate-800 border border-slate-800/40 relative overflow-hidden transition-all group-hover:border-indigo-500/40 shadow-sm">
                <img 
                  src={video.thumbnailUrl} 
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-200" 
                />
                {/* Inside src/pages/Home.jsx - Dynamic Overlay Duration Label */}
              <div className="absolute bottom-2 right-2 bg-black/75 px-1.5 py-0.5 rounded text-[10px] font-bold text-white tracking-wider">
                {formatDuration(video.duration)}
              </div>
              </div>

              {/* Channel metadata specs information rows */}

              {/* Inside src/pages/Home.jsx - Update the avatar image element area */}
              <div className="flex gap-3 px-1">
                
                {/* Dynamic Avatar/Vector Fallback Box */}
                <div className="w-8 h-8 rounded-full bg-white border border-slate-700/30 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                  {video.owner?.avatar && video.owner.avatar.startsWith("http") ? (
                    <img 
                      src={video.owner.avatar} 
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    /* Fallback clean default vector icon for broken string profiles */
                    <svg className="w-6 h-6 text-slate-400 mt-1" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>

                <div className="space-y-1 overflow-hidden">
                  <h4 className="text-xs font-bold leading-tight truncate group-hover:text-indigo-400 transition-colors">
                    {video.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-medium truncate">
                    {video.owner?.fullName || "Unknown Creator"}
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium">
                    {video.views} views &bull; {new Date(video.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}