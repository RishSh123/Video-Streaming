import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../utils/api";

export default function PlaylistModal({ videoId, onClose }) {
  const queryClient = useQueryClient();
  const storedUser = JSON.parse(localStorage.getItem("user") || "null");
  
  // Inline playlist creation state fields
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistDesc, setNewPlaylistDesc] = useState("");

  // Query: Fetch total playlists managed by the active user profile[cite: 10, 11]
  const { data: playlists = [], isLoading } = useQuery({
    queryKey: ["customPlaylists", storedUser?._id],
    queryFn: async () => {
      const response = await apiClient.get(`/playlists/user/${storedUser?._id}`);
      return response.data.data || [];
    },
    enabled: !!storedUser?._id,
  });

  // Mutation: Add or remove video items dynamically from a chosen target collection[cite: 11]
  const toggleVideoMutation = useMutation({
    mutationFn: async ({ playlistId, isAlreadyAdded }) => {
      if (isAlreadyAdded) {
        // Remove video route mapping[cite: 11]
        return await apiClient.patch(`/playlists/remove/${videoId}/${playlistId}`);
      } else {
        // Add video route mapping[cite: 11]
        return await apiClient.patch(`/playlists/add/${videoId}/${playlistId}`);
      }
    },
    onSuccess: () => {
      // Synchronize data states instantly across library dashboard containers
      queryClient.invalidateQueries(["customPlaylists", storedUser?._id]);
    },
  });

  // Mutation: Handle new custom playlist creation actions inline[cite: 11]
  // Mutation: Handle new custom playlist creation actions inline
  const createPlaylistMutation = useMutation({
    // ◄── FIXED: Destructure the name and description directly from the mutation argument[cite: 15]
    mutationFn: async ({ name, description }) => {
      const response = await apiClient.post("/playlists", { name, description }); //[cite: 15]
      return response.data.data; //[cite: 15]
    },
    onSuccess: (newPlaylist) => {
      queryClient.setQueryData(["customPlaylists", storedUser?._id], (oldPlaylists = []) => [
        ...oldPlaylists,
        { ...newPlaylist, videos: [] } //[cite: 15]
      ]);
      setNewPlaylistName(""); //[cite: 15]
      setNewPlaylistDesc(""); //[cite: 15]
      setShowCreateForm(false); //[cite: 15]
    },
    // ◄── EXTRA SAFETY: Add an error callback to instantly show alert failures if the server drops it
    onError: (error) => {
      console.error("Failed to create playlist:", error);
      alert(error.response?.data?.message || "Error connecting to playlist services.");
    }
  });

  const handleCreateSubmit = (e) => {
  e.preventDefault();
  if (!newPlaylistName.trim()) return;

  // ◄── ADD THIS SECURITY CHECK: Prevent user name overlap with system keys
  if (newPlaylistName.trim().toLowerCase() === "watch later") {
    alert("The title 'Watch Later' is reserved for system use. Please pick another name!");
    return;
  }

  createPlaylistMutation.mutate({
    name: newPlaylistName.trim(),
    description: newPlaylistDesc.trim(),
  });
};

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-sm bg-[#0d0e15] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-white flex flex-col max-h-[80vh]">
        
        {/* Header section panel */}
        <div className="p-4 border-b border-slate-800/60 flex justify-between items-center">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">Save Video To...</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors">
            <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Playlists Selection Workspace Checklist List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3 custom-scrollbar">
          {isLoading ? (
            <div className="text-center py-4 text-[11px] text-slate-500">Loading tracking archives...</div>
          ) : playlists.length === 0 && !showCreateForm ? (
            <div className="text-center py-4 text-[11px] text-slate-500 italic">No custom library records found.</div>
          ) : (
            <div className="space-y-2.5">
              {playlists.map((playlist) => {
                // Determine membership by inspecting standard values or populated collection arrays[cite: 11]
                const isAlreadyAdded = playlist.videos?.some(v => (v._id || v) === videoId);

                return (
                  <label 
                    key={playlist._id} 
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/40 hover:bg-slate-800/30 cursor-pointer select-none transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <input 
                        type="checkbox"
                        checked={isAlreadyAdded}
                        disabled={toggleVideoMutation.isPending}
                        onChange={() => toggleVideoMutation.mutate({ playlistId: playlist._id, isAlreadyAdded })}
                        className="w-3.5 h-3.5 accent-indigo-500 cursor-pointer rounded bg-slate-900 border-slate-700"
                      />
                      <span className="text-xs font-bold text-slate-200 truncate">{playlist.name}</span>
                    </div>
                    <span className="text-[9px] text-slate-500 font-semibold shrink-0">
                      {playlist.videos?.length || 0} clips
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Create Alternative Utility Actions Footer Workspace */}
        <div className="p-4 bg-slate-950/40 border-t border-slate-800/60">
          {!showCreateForm ? (
            <button 
              onClick={() => setShowCreateForm(true)}
              className="w-full flex items-center justify-center gap-1.5 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 py-1.5 border border-dashed border-indigo-500/20 hover:border-indigo-500/40 bg-indigo-500/5 rounded-xl transition-all"
            >
              <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Create New Playlist
            </button>
          ) : (
            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <input 
                type="text" 
                required
                placeholder="Playlist Title" 
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <input 
                type="text" 
                placeholder="Description (Optional)" 
                value={newPlaylistDesc}
                onChange={(e) => setNewPlaylistDesc(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <div className="flex gap-2 justify-end text-[10px] font-bold">
                <button 
                  type="button" 
                  onClick={() => { setShowCreateForm(false); setNewPlaylistName(""); }}
                  className="px-2.5 py-1.5 text-slate-400 hover:text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={createPlaylistMutation.isPending || !newPlaylistName.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg shadow-sm transition-colors"
                >
                  {createPlaylistMutation.isPending ? "Creating..." : "Save Collection"}
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}