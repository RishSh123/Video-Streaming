import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import apiClient from "../utils/api";

export default function Playlists() {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem("user") || "null");

  const { data: likedVideos = [], isLoading: likedLoading } = useQuery({
    queryKey: ["likedVideos"],
    queryFn: async () => {
      const response = await apiClient.get("/likes/videos");
      return response.data.data || [];
    },
    enabled: !!storedUser,
  });

  // ◄── NEW FUNCTIONAL QUERY: Fetch system Watch Later list records
  const { data: watchLaterVideos = [], isLoading: watchLaterLoading } = useQuery({
    queryKey: ["watchLaterVideos"],
    queryFn: async () => {
      const response = await apiClient.get("/watch-later");
      return response.data.data || [];
    },
    enabled: !!storedUser,
  });

  const { data: customPlaylists = [], isLoading: playlistsLoading } = useQuery({
    queryKey: ["customPlaylists", storedUser?._id],
    queryFn: async () => {
      const response = await apiClient.get(`/playlists/user/${storedUser?._id}`);
      return response.data.data || [];
    },
    enabled: !!storedUser?._id,
  });

  if (likedLoading || playlistsLoading || watchLaterLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-10 text-white max-w-6xl mx-auto p-2">
      <div className="border-b border-slate-800/60 pb-4">
        <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75c.621 0 1.125.504 1.125 1.125v1.125c0 .621-.504 1.125-1.125 1.125H5.625a1.125 1.125 0 0 1-1.125-1.125V5.625c0-.621.504-1.125 1.125-1.125Z" />
          </svg>
          Your Library
        </h2>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 px-1">System Playlists</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          
          {/* CARD A: LIKED VIDEOS */}
          <div 
            onClick={() => navigate("/playlists/liked-videos")}
            className="group flex flex-col bg-[#0d0e15]/40 border border-slate-900/40 p-3 rounded-2xl cursor-pointer hover:bg-[#121420]/60 hover:border-indigo-500/20 shadow-sm transition-all duration-200"
          >
            <div className="aspect-video w-full rounded-xl bg-gradient-to-br from-rose-600/20 to-indigo-950 overflow-hidden relative border border-slate-800/40 shadow-inner flex items-center justify-center">
              {likedVideos[0]?.thumbnailUrl && (
                <img src={likedVideos[0].thumbnailUrl} alt="Liked" className="w-full h-full object-cover opacity-40 blur-[1px] absolute group-hover:scale-102 transition-transform duration-300" />
              )}
              <div className="z-10 text-center space-y-1">
                <div className="w-10 h-10 rounded-full bg-rose-600 flex items-center justify-center mx-auto shadow-md">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white">
                    <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                  </svg>
                </div>
                <span className="text-xs font-black tracking-wide block pt-1">Liked Videos</span>
              </div>
            </div>
            <div className="pt-2 px-1 flex justify-between items-center text-[10px] text-slate-500 font-semibold">
              <span>{likedVideos.length} clips</span>
            </div>
          </div>

          {/* ◄── CARD B: FUNCTIONAL WATCH LATER */}
          <div 
            onClick={() => navigate("/playlists/watch-later")}
            className="group flex flex-col bg-[#0d0e15]/40 border border-slate-900/40 p-3 rounded-2xl cursor-pointer hover:bg-[#121420]/60 hover:border-indigo-500/20 shadow-sm transition-all duration-200"
          >
            <div className="aspect-video w-full rounded-xl bg-gradient-to-br from-indigo-600/20 to-indigo-950 overflow-hidden relative border border-slate-800/40 shadow-inner flex items-center justify-center">
              {watchLaterVideos[0]?.thumbnailUrl && (
                <img src={watchLaterVideos[0].thumbnailUrl} alt="Watch Later" className="w-full h-full object-cover opacity-40 blur-[1px] absolute group-hover:scale-102 transition-transform duration-300" />
              )}
              <div className="z-10 text-center space-y-1">
                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center mx-auto shadow-md">
                  <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="w-5 h-5 text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                </div>
                <span className="text-xs font-black tracking-wide block pt-1">Watch Later</span>
              </div>
            </div>
            <div className="pt-2 px-1 flex justify-between items-center text-[10px] text-slate-500 font-semibold">
              <span>{watchLaterVideos.length} clips</span>
            </div>
          </div>

        </div>
      </div>

      {/* Your Custom Playlists rendering maps here block exactly unchanged */}
      <div className="space-y-4 pt-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 px-1">Your Custom Playlists</h3>
        {customPlaylists.length === 0 ? (
          <div className="text-xs text-slate-500 py-10 text-center bg-slate-900/10 border border-dashed border-slate-800/40 rounded-2xl max-w-md italic font-medium">
            You haven't created any custom playlists yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {customPlaylists.map((playlist) => (
              <div key={playlist._id} onClick={() => navigate(`/playlists/${playlist._id}`)} className="group flex flex-col space-y-2 cursor-pointer">
                <div className="aspect-video w-full rounded-xl bg-slate-800 overflow-hidden relative border border-slate-800/40 group-hover:border-indigo-500/40 transition-all shadow-md flex items-center justify-center bg-gradient-to-br from-[#121420] to-[#1e2338]">
                  {playlist.videos?.[0]?.thumbnailUrl ? (
                    <img src={playlist.videos[0].thumbnailUrl} alt={playlist.name} className="w-full h-full object-cover" />
                  ) : (
                    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-8 h-8 text-slate-600">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" />
                    </svg>
                  )}
                  <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm text-[9px] font-bold text-white px-2 py-0.5 rounded-md flex items-center gap-1">
                    <span>{playlist.videos?.length || 0} videos</span>
                  </div>
                </div>
                <div className="px-1 space-y-0.5">
                  <h4 className="text-xs font-bold leading-tight truncate text-slate-200 group-hover:text-indigo-400 transition-colors">{playlist.name}</h4>
                  <p className="text-[9px] text-slate-500 font-semibold line-clamp-1">{playlist.description || "No description provided."}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}