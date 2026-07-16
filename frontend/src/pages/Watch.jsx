import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchVideoDetails } from "../utils/videoApi";
import VideoPlayer from "../components/VideoPlayer";
import apiClient from "../utils/api";

export default function Watch() {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState("");

  // Check login state from local storage token/context payload
  const storedUser = JSON.parse(localStorage.getItem("user") || "null");
  const isLoggedIn = !!storedUser;

  // Query 1: Fetch individual stream details
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

  // Query 3: Fetch video comments matching your backend pagination wrapper (data.data.docs)
  const { data: commentsData, isLoading: commentsLoading } = useQuery({
    queryKey: ["comments", videoId],
    queryFn: async () => {
      const response = await apiClient.get(`/comments/v/${videoId}`);
      // Accessing the .docs array created by aggregatePaginate
      return response.data.data.docs || [];
    },
    enabled: !!videoId,
  });

  // Mutation: Submit a new comment
  const postCommentMutation = useMutation({
    mutationFn: async (content) => {
      const response = await apiClient.post(`/comments/v/${videoId}`, { content });
      return response.data.data;
    },
    onSuccess: (newComment) => {
      // Structure the new comment locally to inject into the virtual cache array immediately
      const optimisticComment = {
        ...newComment,
        author: {
          username: storedUser.username,
          fullName: storedUser.fullName,
          avatar: storedUser.avatar,
        },
        likesCount: 0
      };

      queryClient.setQueryData(["comments", videoId], (oldComments = []) => [
        optimisticComment,
        ...oldComments,
      ]);
      setCommentText(""); // Clear text field area
    },
  });

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    postCommentMutation.mutate(commentText);
  };

  // Video.js player options block
  const videoJsOptions = {
    autoplay: true,
    controls: true,
    responsive: true,
    fluid: true,
    poster: video?.thumbnailUrl,
    sources: [
      {
        src: video?.videoUrl,
        type: "application/x-mpegURL",
      },
    ],
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
      
      {/* LEFT COLUMN: Main Video Player & Details View */}
      <div className="flex-1 space-y-4 overflow-hidden">
        
        <div className="aspect-video w-full rounded-2xl bg-black border border-slate-800/40 overflow-hidden shadow-2xl relative">
          {video?.videoUrl && <VideoPlayer options={videoJsOptions} />}
        </div>

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
              className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700/30 overflow-hidden shrink-0 flex items-center justify-center shadow-md relative"
            >
              {video?.owner?.avatar && (video.owner.avatar.startsWith("http://") || video.owner.avatar.startsWith("https://")) ? (
                <img 
                  src={video.owner.avatar} 
                  alt="Avatar" 
                  className="w-full h-full object-cover absolute inset-0" 
                />
              ) : (
                // Beautiful default fallback letter circle when no remote picture exists
                <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white uppercase tracking-wider">
                  {video?.owner?.username?.substring(0, 2) || "CH"}
                </div>
              )}
            </Link>
            
            <div className="overflow-hidden">
              <Link to={`/c/${video?.owner?.username}`} className="text-xs font-bold block hover:text-indigo-400 transition-colors">
                {video?.owner?.fullName || "Channel Operator"}
              </Link>
              <p className="text-[10px] text-slate-400 font-medium">@{video?.owner?.username}</p>
            </div>
          </div>

          {/* Context Description Summary Box */}
          <div className="p-4 bg-slate-900/40 border border-slate-800/60 rounded-2xl text-xs font-medium leading-relaxed mt-4 text-slate-300">
            <p className="whitespace-pre-wrap">{video?.description}</p>
          </div>
        </div>

        {/* ========================================================= */}
        {/* --- DYNAMIC INTERACTIVE COMMENTS APP COMPONENT VIEW --- */}
        {/* ========================================================= */}
        <div className="pt-6 border-t border-slate-800/50 space-y-4 px-1">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            Comments <span className="text-xs font-semibold text-slate-500">({commentsData?.length || 0})</span>
          </h3>

          {/* Gate Validation Logic: Checking if User session is logged in */}
          {isLoggedIn ? (
            <form onSubmit={handleCommentSubmit} className="flex gap-3 items-start bg-slate-900/20 p-3.5 rounded-2xl border border-slate-800/40">
              <div className="w-8 h-8 rounded-full bg-slate-800 overflow-hidden flex items-center justify-center shrink-0">
                {storedUser.avatar ? (
                  <img src={storedUser.avatar} alt="Me" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] font-bold text-indigo-400">{storedUser.username?.substring(0, 2).toUpperCase()}</span>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Share your thoughts on this stream..."
                  rows="2"
                  className="w-full bg-transparent text-xs text-slate-200 outline-none resize-none placeholder-slate-500 border-b border-slate-800 focus:border-indigo-500 transition-colors py-1"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={postCommentMutation.isPending || !commentText.trim()}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors"
                  >
                    {postCommentMutation.isPending ? "Posting..." : "Comment"}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            // Disabled Input Field State overlay with interactive redirect notice
            <div className="bg-indigo-950/20 border border-indigo-900/30 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="space-y-0.5 text-center sm:text-left">
                <p className="text-xs font-extrabold text-indigo-400">Join the discussion</p>
                <p className="text-[10px] text-slate-400 font-medium">Please sign in to write comments and interact with creators.</p>
              </div>
              <button
                onClick={() => navigate("/login")}
                className="bg-indigo-600 hover:bg-indigo-500 text-[10px] font-bold px-4 py-2 rounded-lg whitespace-nowrap transition-colors shadow-md"
              >
                Sign In to Comment
              </button>
            </div>
          )}

          {/* List Renderer parsing aggregate pipeline array payload maps */}
          {commentsLoading ? (
            <div className="text-center py-4 text-xs text-slate-500">Loading stream comments timeline...</div>
          ) : !commentsData || commentsData.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-500 italic">No comments yet. Be the first to start the conversation!</div>
          ) : (
            <div className="space-y-4">
              {commentsData.map((comment) => (
                <div key={comment._id} className="flex gap-3 group">
                  <Link 
                    to={`/c/${comment.author?.username}`} 
                    className="w-8 h-8 rounded-full bg-slate-800 border border-slate-800/40 overflow-hidden shrink-0 flex items-center justify-center mt-0.5"
                  >
                    {comment.author?.avatar ? (
                      <img src={comment.author.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-slate-700 flex items-center justify-center text-[10px] font-extrabold text-white">
                        {comment.author?.username?.substring(0, 2).toUpperCase() || "U"}
                      </div>
                    )}
                  </Link>
                  <div className="flex-1 space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link to={`/c/${comment.author?.username}`} className="text-[10px] font-extrabold text-slate-200 hover:text-indigo-400 transition-colors">
                        {comment.author?.fullName || "Anonymous User"}
                      </Link>
                      <span className="text-[9px] text-slate-500 font-medium">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-300 font-medium break-words">
                      {comment.content}
                    </p>
                    
                    {/* Render Like Counters from your aggregation framework context lookup */}
                    {comment.likesCount > 0 && (
                      <div className="text-[9px] text-indigo-400/80 font-bold flex items-center gap-1 mt-1">
                        ♥ {comment.likesCount} {comment.likesCount === 1 ? "like" : "likes"}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Sidebar recommendations grid stack panel */}
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
                <div className="w-32 aspect-video rounded-xl bg-slate-800 border border-slate-800/40 overflow-hidden shrink-0 relative shadow-md">
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