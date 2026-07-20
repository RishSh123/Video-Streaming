import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../utils/api";

export default function WatchLater() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ["watchLaterVideos"],
    queryFn: async () => {
      const response = await apiClient.get("/watch-later");
      return response.data.data || [];
    }
  });

  const removeMutation = useMutation({
    mutationFn: async (videoId) => {
      await apiClient.post(`/watch-later/toggle/${videoId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["watchLaterVideos"]);
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-white max-w-4xl mx-auto p-2">
      <div className="border-b border-slate-800/60 pb-4">
        <h2 className="text-xl font-black tracking-tight text-slate-100 flex items-center gap-2">
          Watch Later
        </h2>
        <p className="text-[11px] text-slate-400 font-medium mt-0.5">{videos.length} clips saved</p>
      </div>

      {videos.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/10 border border-dashed border-slate-800/40 rounded-2xl max-w-xl mx-auto italic text-xs text-slate-500">
          No streams saved to watch later.
        </div>
      ) : (
        <div className="space-y-3">
          {videos.map((video, index) => (
            <div key={video._id} className="group flex gap-4 p-3 rounded-2xl bg-[#0d0e15]/40 border border-slate-900/40 hover:border-indigo-500/20 relative items-center">
              <span className="text-slate-600 font-black text-xs w-4">{index + 1}</span>
              <div onClick={() => navigate(`/watch/${video._id}`)} className="w-40 aspect-video rounded-xl overflow-hidden cursor-pointer bg-slate-800 shrink-0">
                <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 onClick={() => navigate(`/watch/${video._id}`)} className="text-xs font-bold truncate cursor-pointer hover:text-indigo-400">{video.title}</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">@{video.owner?.username}</p>
              </div>
              <button onClick={() => removeMutation.mutate(video._id)} className="text-slate-500 hover:text-rose-400 p-2">
                <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}