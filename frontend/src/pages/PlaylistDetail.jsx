import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../utils/api";

export default function PlaylistDetail() {
  const { playlistId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const storedUser = JSON.parse(localStorage.getItem("user") || "null");

  // Local state for header workspace modifications
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  // Query: Fetch individual playlist data details[cite: 14]
  const { data: playlist, isLoading, isError, error } = useQuery({
    queryKey: ["playlistDetails", playlistId],
    queryFn: async () => {
      const response = await apiClient.get(`/playlists/${playlistId}`);
      return response.data.data;
    },
    enabled: !!playlistId,
  });

  // Synchronize input fields once remote data maps over cleanly
  useEffect(() => {
    if (playlist) {
      setEditName(playlist.name || "");
      setEditDesc(playlist.description || "");
    }
  }, [playlist]);

  // Mutation: Modify playlist text attributes (Name / Description)[cite: 14]
  const updatePlaylistMutation = useMutation({
    mutationFn: async ({ name, description }) => {
      // Hits PATCH /api/v1/playlists/:playlistId[cite: 20]
      const response = await apiClient.patch(`/playlists/${playlistId}`, { name, description });
      return response.data.data;
    },
    onSuccess: (updatedData) => {
      // Surgically inject update values straight into queries caches map matrices
      queryClient.setQueryData(["playlistDetails", playlistId], (old) => ({
        ...old,
        name: updatedData.name,
        description: updatedData.description,
      }));
      queryClient.invalidateQueries(["customPlaylists", storedUser?._id]);
      setIsEditing(false);
    },
    onError: (err) => {
      alert(err.response?.data?.message || "Failed to update playlist details.");
    }
  });

  // Mutation: Allow users to delete the playlist entirely[cite: 14]
  const deletePlaylistMutation = useMutation({
    mutationFn: async () => {
      await apiClient.delete(`/playlists/${playlistId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["customPlaylists", storedUser?._id]);
      navigate("/playlists");
    },
  });

  // Mutation: Allow users to surgically drop a single video track from this list[cite: 14]
  const removeVideoMutation = useMutation({
    mutationFn: async (videoId) => {
      await apiClient.patch(`/playlists/remove/${videoId}/${playlistId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["playlistDetails", playlistId]);
    },
  });

  const handleUpdateSubmit = (e) => {
    e.preventDefault();
    if (!editName.trim()) return;
    updatePlaylistMutation.mutate({
      name: editName.trim(),
      description: editDesc.trim(),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (isError || !playlist) {
    return (
      <div className="p-4 bg-rose-950/20 border border-rose-900/40 rounded-xl text-rose-400 text-xs text-center max-w-xl mx-auto mt-6">
        {error?.message || "Playlist view registry missing or deleted."}
      </div>
    );
  }

  const isOwner = storedUser?._id === (playlist.owner?._id || playlist.owner);

  return (
    <div className="space-y-6 text-white max-w-5xl mx-auto p-2">
      
      {/* ================= HEADER EDITING SECTION PANELS ================= */}
      <div className="border-b border-slate-800/60 pb-5">
        {isEditing ? (
          /* Inline modification form template layout */
          <form onSubmit={handleUpdateSubmit} className="space-y-3 max-w-2xl bg-slate-900/20 p-4 border border-slate-800/60 rounded-2xl">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500 pl-0.5">Playlist Name</label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500 pl-0.5">Description</label>
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows="2"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
              />
            </div>
            <div className="flex gap-2 justify-end text-[10px] font-bold pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setEditName(playlist.name);
                  setEditDesc(playlist.description);
                }}
                className="px-3 py-1.5 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-300 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updatePlaylistMutation.isPending || !editName.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-1.5 rounded-xl shadow-md transition-all cursor-pointer"
              >
                {updatePlaylistMutation.isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        ) : (
          /* Static view display panel with button control states */
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-xl font-black tracking-tight text-slate-100 flex items-center gap-2">
                <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="w-5 h-5 text-indigo-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" />
                </svg>
                {playlist.name}
              </h2>
              <p className="text-[11px] text-slate-400 font-semibold">
                Collection built by @{playlist.owner?.username || "Operator"} &bull; {playlist.videos?.length || 0} items
              </p>
              {playlist.description && (
                <p className="text-xs text-slate-400 mt-2 bg-slate-900/20 p-2.5 border border-slate-800/40 rounded-xl max-w-2xl font-medium leading-relaxed">
                  {playlist.description}
                </p>
              )}
            </div>

            {isOwner && (
              <div className="flex items-center gap-2 text-[10px] font-bold self-start sm:self-auto">
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 px-3.5 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  Edit Details
                </button>
                <button
                  onClick={() => {
                    if (confirm("Are you sure you want to permanently delete this entire playlist collection?")) {
                      deletePlaylistMutation.mutate();
                    }
                  }}
                  disabled={deletePlaylistMutation.isPending}
                  className="bg-rose-950/20 border border-rose-900/30 text-rose-400 hover:bg-rose-900/30 px-3.5 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  {deletePlaylistMutation.isPending ? "Purging..." : "Delete Playlist"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ================= VIDEOS FEED BLOCK ================= */}
      {playlist.videos?.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/10 border border-dashed border-slate-800/40 rounded-2xl max-w-xl mx-auto">
          <p className="text-xs text-slate-500 font-medium italic">This playlist contains no video items yet.</p>
        </div>
      ) : (
        <div className="space-y-3 max-w-4xl">
          {playlist.videos.map((video, index) => {
            if (!video) return null;
            return (
              <div 
                key={video._id}
                className="group flex flex-col sm:flex-row gap-4 p-3 rounded-2xl bg-[#0d0e15]/40 border border-slate-900/40 hover:bg-[#121420]/60 hover:border-indigo-500/20 transition-all duration-200 relative"
              >
                <div className="hidden sm:flex items-center text-slate-600 font-black text-xs pl-1 w-4 shrink-0">
                  {index + 1}
                </div>

                <div 
                  onClick={() => navigate(`/watch/${video._id}`)}
                  className="w-full sm:w-44 aspect-video rounded-xl bg-slate-800 border border-slate-800/40 overflow-hidden shrink-0 relative shadow-md cursor-pointer"
                >
                  <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
                  <span className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm text-[9px] font-bold text-white px-1.5 py-0.5 rounded-md">
                    {video.duration ? `${Math.floor(video.duration / 60)}:${String(Math.floor(video.duration % 60)).padStart(2, '0')}` : "0:02"}
                  </span>
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                  <div className="space-y-1">
                    <h4 
                      onClick={() => navigate(`/watch/${video._id}`)}
                      className="text-xs font-bold leading-snug text-slate-200 group-hover:text-indigo-400 transition-colors cursor-pointer line-clamp-2 pr-8"
                    >
                      {video.title}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-semibold">
                      By @{video.owner?.username || "Creator"} &bull; {video.views || 0} views
                    </p>
                  </div>
                </div>

                {isOwner && (
                  <button
                    onClick={() => removeVideoMutation.mutate(video._id)}
                    disabled={removeVideoMutation.isPending}
                    className="absolute top-3 right-3 p-1 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-950/20 transition-colors cursor-pointer"
                    title="Remove item trace from collection folder"
                  >
                    <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}