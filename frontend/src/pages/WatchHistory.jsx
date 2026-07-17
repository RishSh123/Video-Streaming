import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import apiClient from "../utils/api";

export default function WatchHistory() {
  const navigate = useNavigate();

  const { data: historyVideos = [], isLoading, isError, error } = useQuery({
    queryKey: ["watchHistory"],
    queryFn: async () => {
      const response = await apiClient.get("/users/watch-history");
      return response.data.data || [];
    },
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
      <div className="p-4 bg-rose-950/20 border border-rose-900/40 rounded-xl text-rose-400 text-xs text-center max-w-xl mx-auto mt-6">
        Error loading history feed: {error.message || "Session error."}
      </div>
    );
  }

  return (
    <div className="space-y-6 text-white max-w-5xl mx-auto p-2">
      {/* Header section with explicit divider line */}
      <div className="border-b border-slate-800/60 pb-4">
        <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          Watch History
        </h1>
      </div>

      {historyVideos.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/10 border border-dashed border-slate-800/40 rounded-2xl max-w-xl mx-auto">
          <p className="text-xs text-slate-500 font-medium italic">Your watch history is empty.</p>
          <button 
            onClick={() => navigate("/home")} 
            className="mt-4 text-[11px] bg-indigo-600 hover:bg-indigo-500 font-bold px-4 py-2 rounded-xl transition-all shadow-md cursor-pointer"
          >
            Explore Streams
          </button>
        </div>
      ) : (
        /* Vertical List Grid Panel */
        <div className="space-y-3 max-w-4xl">
          {historyVideos.map((video) => {
            if (!video) return null;
            return (
              <div 
                style={{ cursor: 'pointer'}}
                onClick={() => navigate(`/watch/${video._id}`)}
                key={video._id}
                className="group flex flex-col sm:flex-row gap-5 p-3 rounded-2xl bg-[#0d0e15]/40 border border-slate-900/40 hover:bg-[#121420]/60 hover:border-indigo-500/20 transition-all duration-200 relative shadow-sm"
              >
                {/* Thumbnail Layer Container */}
                <div 
                  onClick={() => navigate(`/watch/${video._id}`)}
                  className="w-full sm:w-56 aspect-video rounded-xl bg-slate-800 border border-slate-800/40 overflow-hidden shrink-0 relative shadow-md cursor-pointer group-hover:shadow-lg transition-all"
                >
                  <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102" />
                  
                  {/* Optional Mock Duration pill tag bottom-right corner */}
                  <span className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm text-[9px] font-bold text-white px-1.5 py-0.5 rounded-md tracking-wider">
                    {video.duration ? `${Math.floor(video.duration / 60)}:${String(Math.floor(video.duration % 60)).padStart(2, '0')}` : "0:02"}
                  </span>
                </div>

                {/* Text Metadata Layout Box */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 space-y-3">
                  <div className="space-y-1">
                    <h4 
                      onClick={() => navigate(`/watch/${video._id}`)}
                      className="text-sm font-bold leading-snug text-slate-200 group-hover:text-indigo-400 transition-colors cursor-pointer line-clamp-2"
                    >
                      {video.title}
                    </h4>
                    
                    <p className="text-[10px] text-slate-500 font-semibold flex items-center gap-1.5">
                      <span>{video.views || 0} views</span>
                      <span className="text-slate-700">&bull;</span>
                      <span className="text-indigo-400/80 bg-indigo-950/30 px-2 py-0.5 rounded-md font-bold text-[9px]">Watched</span>
                    </p>

                    {video.description && (
                      <p className="text-[11px] text-slate-400 line-clamp-2 pt-1 font-medium leading-relaxed">
                        {video.description}
                      </p>
                    )}
                  </div>

                  {/* Channel Account Information Block */}
                  <div className="flex items-center gap-2 pt-1">
                    <Link 
                      to={`/c/${video.owner?.username}`}
                      className="w-6 h-6 rounded-full bg-slate-800 overflow-hidden flex items-center justify-center shrink-0 border border-slate-700/40 shadow-sm relative"
                    >
                      {video.owner?.avatar ? (
                        <img src={video.owner.avatar} alt="Avatar" className="w-full h-full object-cover absolute inset-0" />
                      ) : (
                        <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-[9px] font-black text-white uppercase">
                          {video.owner?.username?.substring(0, 2)}
                        </div>
                      )}
                    </Link>
                    <Link 
                      to={`/c/${video.owner?.username}`}
                      className="text-[11px] font-bold text-slate-400 hover:text-indigo-300 transition-colors truncate"
                    >
                      {video.owner?.fullName || "Channel Operator"}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}