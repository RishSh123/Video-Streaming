import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../utils/api";

export default function PublishModal({ onClose }) {
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [tags, setTags] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);

  // Mutation: Upload video files and metadata
  const publishMutation = useMutation({
    mutationFn: async (formData) => {
      // Must send as multipart/form-data for Multer processing
      const response = await apiClient.post("/videos/publish", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["videos"]);
      queryClient.invalidateQueries(["channelVideos"]);
      onClose();
    },
    onError: (error) => {
      alert(error.response?.data?.message || "Failed to publish video asset.");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !category.trim()) {
      alert("Title, description, and category fields are strictly required.");
      return;
    }
    if (!videoFile) {
      alert("Please select a video file (.mp4) to upload.");
      return;
    }
    if (!thumbnail) {
      alert("Please select a thumbnail image file.");
      return;
    }

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("description", description.trim());
    formData.append("category", category.trim());
    formData.append("tags", tags.trim());
    formData.append("videoFile", videoFile);
    formData.append("thumbnail", thumbnail);

    publishMutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-lg bg-[#0d0e15] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-white flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800/60 flex justify-between items-center">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-200">
            Publish New Video
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

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs font-medium custom-scrollbar">
          <div>
            <label className="block text-slate-400 font-bold mb-1">Title *</label>
            <input
              type="text"
              required
              placeholder="Give your stream a title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1">Description *</label>
            <textarea
              required
              rows="3"
              placeholder="Tell viewers about your video"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-bold mb-1">Category *</label>
              <input
                type="text"
                required
                placeholder="Gaming, Tech, Music..."
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-bold mb-1">Tags (Comma-separated)</label>
              <input
                type="text"
                placeholder="react, coding, tutorial"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          {/* Video File Selection */}
          <div>
            <label className="block text-slate-400 font-bold mb-1">Video File (.mp4) *</label>
            <input
              type="file"
              accept="video/mp4,video/mkv,video/webm"
              required
              onChange={(e) => setVideoFile(e.target.files[0])}
              className="w-full text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 file:cursor-pointer cursor-pointer"
            />
          </div>

          {/* Thumbnail Selection */}
          <div>
            <label className="block text-slate-400 font-bold mb-1">Thumbnail Image *</label>
            <input
              type="file"
              accept="image/*"
              required
              onChange={(e) => setThumbnail(e.target.files[0])}
              className="w-full text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-800 file:text-slate-300 hover:file:bg-slate-700 file:cursor-pointer cursor-pointer"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex gap-2 justify-end pt-3 border-t border-slate-800/60 font-bold">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={publishMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2 rounded-xl shadow-md transition-all cursor-pointer"
            >
              {publishMutation.isPending ? "Uploading to Cloud Pipeline..." : "Publish Video"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}