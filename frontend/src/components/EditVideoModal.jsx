import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../utils/api";

export default function EditVideoModal({ video, onClose }) {
  const queryClient = useQueryClient();

  const [title, setTitle] = useState(video?.title || "");
  const [description, setDescription] = useState(video?.description || "");
  const [category, setCategory] = useState(video?.category || "General");
  const [thumbnail, setThumbnail] = useState(null);

  // Mutation: Update Video Text Details & Thumbnail
  const updateMutation = useMutation({
    mutationFn: async (formData) => {
      // Hits PATCH /api/v1/videos/v/:videoId
      const response = await apiClient.patch(`/videos/v/${video._id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["watchVideo", video._id]);
      queryClient.invalidateQueries(["channelVideos"]);
      onClose();
    },
    onError: (error) => {
      alert(error.response?.data?.message || "Failed to update video details.");
    },
  });

  // Mutation: Delete Entire Video & Associated Cloud Storage Files
  const deleteMutation = useMutation({
    mutationFn: async () => {
      // Hits DELETE /api/v1/videos/v/:videoId
      await apiClient.delete(`/videos/v/${video._id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["channelVideos"]);
      queryClient.invalidateQueries(["videos"]);
      onClose();
    },
    onError: (error) => {
      alert(error.response?.data?.message || "Failed to delete video.");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    if (title.trim()) formData.append("title", title.trim());
    if (description.trim()) formData.append("description", description.trim());
    if (category.trim()) formData.append("category", category.trim());
    if (thumbnail) formData.append("thumbnail", thumbnail);

    updateMutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-lg bg-[#0d0e15] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-white flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800/60 flex justify-between items-center">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-200">
            Edit Video Details
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
          >
            <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs font-medium custom-scrollbar">
          <div>
            <label className="block text-slate-400 font-bold mb-1">Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1">Description</label>
            <textarea
              rows="3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1">Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1">Replace Thumbnail (Optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setThumbnail(e.target.files[0])}
              className="w-full text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-800 file:text-slate-300 hover:file:bg-slate-700 file:cursor-pointer cursor-pointer"
            />
          </div>

          {/* Actions Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800/60 font-bold">
            <button
              type="button"
              onClick={() => {
                if (confirm("Are you sure you want to permanently delete this video and remove all associated cloud files?")) {
                  deleteMutation.mutate();
                }
              }}
              disabled={deleteMutation.isPending}
              className="bg-rose-950/20 border border-rose-900/30 text-rose-400 hover:bg-rose-900/30 px-3.5 py-2 rounded-xl transition-all cursor-pointer"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Video"}
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-400 hover:text-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2 rounded-xl shadow-md transition-all cursor-pointer"
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}