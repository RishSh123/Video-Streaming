import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import apiClient from "../utils/api";

export default function LikedVideos() {
  const navigate = useNavigate();

  const { data: likedVideos = [], isLoading, isError, error } = useQuery({
    queryKey: ["likedVideos"],
    queryFn: async () => {
      const response = await apiClient.get("/likes/videos");
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
        Error loading liked playlist items: {error.message || "Network Error."}
      </div>
    );
  }

  return (
    <div className="space-y-6 text-white max-w-5xl mx-auto p-2">
      
      {/* Dynamic Header Box */}
      <div className="border-b border-slate-800/60 pb-4 flex items-center gap-3">
        <button 
          onClick={() => navigate("/playlists")}
          className="p-1.5 rounded-xl bg-slate-900/50 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
        >
          <svg fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <div>
          <h2 className="text-xl font-black tracking-tight flex items-center gap-2 text-rose-500">
            Liked Videos
          </h2>
          <p className="text-[11px] text-slate-400 font-medium">A compilation layout showing all contents you have marked with a like action.</p>
        </div>
      </div>

      {likedVideos.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/10 border border-dashed border-slate-800/40 rounded-2xl max-w-xl mx-auto">
          <p className="text-xs text-slate-500 font-medium italic">You haven't liked any streams yet.</p>
        </div>
      ) : (
        <div  onClick={() => navigate(`/watch/${video._id}`)} className="space-y-3 max-w-4xl">
            {likedVideos.map((item) => {
            if (!item) return null;
            
            // ◄── FIX: Unpack the video details if the backend nests them inside a "video" field
            const video = item.video ? item.video : item; 
            
            if (!video || !video._id) return null;

            return (
                <div 
                style={{ cursor: 'pointer'}}
                key={item._id || video._id}
                className="group flex flex-col sm:flex-row gap-5 p-3 rounded-2xl bg-[#0d0e15]/40 border border-slate-900/40 hover:bg-[#121420]/60 hover:border-indigo-500/20 transition-all duration-200 relative shadow-sm"
                >
                {/* Thumbnail Container */}
                <div 
                    onClick={() => navigate(`/watch/${video._id}`)} // ◄── Navigates cleanly using valid ID
                    className="w-full sm:w-56 aspect-video rounded-xl bg-slate-800 border border-slate-800/40 overflow-hidden shrink-0 relative shadow-md cursor-pointer"
                >
                    {video.thumbnailUrl ? (
                    <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
                    ) : (
                    <div className="w-full h-full bg-slate-900 flex items-center justify-center text-[10px] text-slate-600">No Image</div>
                    )}
                    <span className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm text-[9px] font-bold text-white px-1.5 py-0.5 rounded-md tracking-wider">
                    {video.duration ? `${Math.floor(video.duration / 60)}:${String(Math.floor(video.duration % 60)).padStart(2, '0')}` : "0:02"}
                    </span>
                </div>

                {/* Info Block Metadata */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 space-y-3">
                    <div className="space-y-1">
                    <h4 
                        onClick={() => navigate(`/watch/${video._id}`)}
                        className="text-sm font-bold leading-snug text-slate-200 group-hover:text-indigo-400 transition-colors cursor-pointer line-clamp-2"
                    >
                        {video.title || "Untitled Video"}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-semibold flex items-center gap-1.5">
                        <span>{video.views || 0} views</span>
                    </p>
                    </div>

                    {/* Channel Owner Meta Row */}
                    <div className="flex items-center gap-2 pt-1">
                    <Link 
                        to={`/c/${video.owner?.username}`}
                        className="w-6 h-6 rounded-full bg-slate-800 overflow-hidden flex items-center justify-center border border-slate-700/40 shrink-0 relative"
                    >
                        {video.owner?.avatar ? (
                        <img src={video.owner.avatar} alt="Avatar" className="w-full h-full object-cover absolute inset-0" />
                        ) : (
                        <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-[9px] font-black text-white uppercase">
                            {video.owner?.username?.substring(0, 2) || "CH"}
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