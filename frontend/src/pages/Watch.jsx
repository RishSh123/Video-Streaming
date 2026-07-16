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
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editText, setEditText] = useState("");
  const [commentPage, setCommentPage] = useState(1);

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

  // Mutation: Toggle like status on an individual comment via your backend router
const toggleCommentLikeMutation = useMutation({
  mutationFn: async (commentId) => {
    // Hits the exact route: /likes/toggle/c/:commentId
    const response = await apiClient.post(`/likes/toggle/c/${commentId}`);
    return { commentId, ...response.data.data }; // Returns the target commentId and { isLiked: true/false }
  },
  onSuccess: ({ commentId, isLiked }) => {
    // Dynamically update the cached list state locally so counts change instantly
    queryClient.setQueryData(["comments", videoId], (oldComments = []) =>
      oldComments.map((comment) => {
        if (comment._id === commentId) {
          return {
            ...comment,
            likesCount: isLiked 
              ? (comment.likesCount || 0) + 1 
              : Math.max(0, (comment.likesCount || 0) - 1),
            // Track dynamic inline changes if needed
            isLikedLocal: isLiked
          };
        }
        return comment;
      })
    );
  },
});

// Mutation: Edit an existing comment text string
const updateCommentMutation = useMutation({
  mutationFn: async ({ commentId, content }) => {
    const response = await apiClient.patch(`/comments/c/${commentId}`, { content });
    return response.data.data;
  },
  onSuccess: (updatedComment) => {
    queryClient.setQueryData(["comments", videoId], (oldComments = []) =>
      oldComments.map((c) => (c._id === updatedComment._id ? { ...c, content: updatedComment.content } : c))
    );
    setEditingCommentId(null);
    setEditText("");
  },
});

// Mutation: Delete a comment permanently
const deleteCommentMutation = useMutation({
  mutationFn: async (commentId) => {
    await apiClient.delete(`/comments/c/${commentId}`);
    return commentId;
  },
  onSuccess: (deletedCommentId) => {
    queryClient.setQueryData(["comments", videoId], (oldComments = []) =>
      oldComments.filter((c) => c._id !== deletedCommentId)
    );
  },
});


// Mutation: Toggle like status on the video track[cite: 6]
const toggleVideoLikeMutation = useMutation({
  mutationFn: async () => {
    // Hits the exact route: /likes/toggle/v/:videoId[cite: 6]
    const response = await apiClient.post(`/likes/toggle/v/${videoId}`);
    return response.data.data; // Returns { isLiked: true/false }
  },
  onSuccess: ({ isLiked }) => {
    // Dynamically adjust the cached video metadata query state instantly
    queryClient.setQueryData(["watchVideo", videoId], (oldVideo) => {
      if (!oldVideo) return oldVideo;
      return {
        ...oldVideo,
        likesCount: isLiked 
          ? (oldVideo.likesCount || 0) + 1 
          : Math.max(0, (oldVideo.likesCount || 0) - 1),
        isLikedLocal: isLiked,
      };
    });
  },
});

// Mutation: Toggle subscription tracking for a channel creator[cite: 10]
const toggleSubscriptionMutation = useMutation({
  mutationFn: async (channelId) => {
    // Hits route: POST /api/v1/subscriptions/c/:channelId[cite: 10]
    const response = await apiClient.post(`/subscriptions/c/${channelId}`);
    return { channelId, ...response.data.data }; // Returns { isSubscribed: true/false }
  },
  onSuccess: ({ isSubscribed }) => {
    // Dynamically adjust the cached video metadata query state instantly
    queryClient.setQueryData(["watchVideo", videoId], (oldVideo) => {
      if (!oldVideo) return oldVideo;
      return {
        ...oldVideo,
        isSubscribedLocal: isSubscribed,
        subscribersCount: isSubscribed 
          ? (oldVideo.subscribersCount || 0) + 1 
          : Math.max(0, (oldVideo.subscribersCount || 0) - 1),
      };
    });
  },
});




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

        {/* Video Text Metadata Layout */}
<div className="space-y-2.5 px-1">
  <h1 className="text-lg md:text-xl font-extrabold tracking-tight leading-snug text-slate-100">
    {video?.title}
  </h1>
  
  {/* Flex row handling views on left and engagement controls on the right */}
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800/50 pb-3 text-slate-400">
    <div className="text-[11px] font-semibold">
      {video?.views || 0} views &bull; {new Date(video?.createdAt).toLocaleDateString()}
    </div>

    {/* VIDEO ENGAGEMENT CONTROLS */}
    <div className="flex items-center gap-2 self-end sm:self-auto">
      <button
        onClick={() => {
          if (!isLoggedIn) {
            navigate("/login");
            return;
          }
          toggleVideoLikeMutation.mutate();
        }}
        disabled={toggleVideoLikeMutation.isPending}
        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all bg-slate-900/60 border border-slate-800/80 hover:bg-slate-800/60 ${
          video?.isLikedLocal
            ? "text-rose-500 border-rose-900/30 bg-rose-950/10"
            : "text-slate-300"
        }`}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill={video?.isLikedLocal ? "currentColor" : "none"} 
          stroke="currentColor" 
          className="w-4 h-4 stroke-[2.5]"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
        </svg>
        <span>{video?.likesCount || 0}</span>
      </button>
    </div>
  </div>

  {/* Publisher Metadata Card remains right below... */}
  {/* Publisher Metadata Card Layout Row */}
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-3 mt-1 border-t border-slate-900/40">
  <div className="flex gap-3 items-center">
    <Link 
      to={`/c/${video?.owner?.username}`}
      className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700/30 overflow-hidden shrink-0 flex items-center justify-center shadow-md relative"
    >
      {video?.owner?.avatar && (video.owner.avatar.startsWith("http://") || video.owner.avatar.startsWith("https://")) ? (
        <img src={video.owner.avatar} alt="Avatar" className="w-full h-full object-cover absolute inset-0" />
      ) : (
        <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white uppercase">
          {video?.owner?.username?.substring(0, 2) || "CH"}
        </div>
      )}
    </Link>
    
    <div className="overflow-hidden">
      <Link to={`/c/${video?.owner?.username}`} className="text-xs font-bold block hover:text-indigo-400 transition-colors">
        {video?.owner?.fullName || "Channel Operator"}
      </Link>
      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium mt-0.5">
        <span>@{video?.owner?.username}</span>
        <span className="text-slate-600">&bull;</span>
        <span>{video?.subscribersCount || 0} subscribers</span>
      </div>
    </div>
  </div>

  {/* DYNAMIC ACTION BUTTON: Prevent self-subscription rendering locally */}
  {storedUser?._id !== video?.owner?._id && (
    <button
      
      onClick={() => {
        if (!isLoggedIn) {
          navigate("/login");
          return;
        }
        toggleSubscriptionMutation.mutate(video?.owner?._id);
      }}
      disabled={toggleSubscriptionMutation.isPending}
      className={`text-xs font-bold hover:bg-purple-800 hover:scale-105 px-5 py-2 rounded-full transition-all tracking-wide shadow-sm self-start sm:self-auto ${
        video?.isSubscribedLocal
          ? "bg-slate-800 text-slate-400 border border-slate-700/50 hover:bg-rose-950/20 hover:text-rose-400 hover:border-rose-900/30"
          : "bg-indigo-600 text-white hover:bg-indigo-500"
      }`}
    >
      {toggleSubscriptionMutation.isPending 
        ? "Processing..." 
        : video?.isSubscribedLocal 
          ? "Subscribed" 
          : "Subscribe"
      }
    </button>
  )}
</div>

          {/* Context Description Summary Box */}
          <div className="p-4 bg-slate-900/40 border border-slate-800/60 rounded-2xl text-xs font-medium leading-relaxed mt-4 text-slate-300">
            <p className="whitespace-pre-wrap">{video?.description}</p>
          </div>
        </div>

        {/* ========================================================= */}
        {/* --- DYNAMIC INTERACTIVE COMMENTS APP COMPONENT VIEW --- */}
        {/* ========================================================= */}
        {/* --- UPGRADED MASTER COMMENTS CONTROL BLOCK --- */}
<div className="pt-6 border-t border-slate-800/50 space-y-4 px-1">
  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
    Comments <span className="text-xs font-semibold text-slate-500">({commentsData?.length || 0})</span>
  </h3>

  {/* Conditional Input Box For New Posts */}
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
    <div className="bg-indigo-950/20 border border-indigo-900/30 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-3">
      <div className="space-y-0.5 text-center sm:text-left">
        <p className="text-xs font-extrabold text-indigo-400">Join the discussion</p>
        <p className="text-[10px] text-slate-400 font-medium">Please sign in to write comments.</p>
      </div>
      <button
        onClick={() => navigate("/login")}
        className="bg-indigo-600 hover:bg-indigo-500 hover:bg-purple-800 hover:scale-105 text-[10px] font-bold px-4 py-2 rounded-lg whitespace-nowrap transition-colors shadow-md"
      >
        Sign In to Comment
      </button>
    </div>
  )}

  {/* Comments Render Engine */}
  {commentsLoading ? (
    <div className="text-center py-4 text-xs text-slate-500">Loading stream comments...</div>
  ) : !commentsData || commentsData.length === 0 ? (
    <div className="text-center py-6 text-xs text-slate-500 italic">No comments yet.</div>
  ) : (
    <div className="space-y-4">
      {commentsData.map((comment) => {
        // Evaluate if the active session matches this specific comment owner context
        const isCommentOwner = storedUser && (comment.owner === storedUser._id || comment.author?._id === storedUser._id);
        const isCurrentlyEditing = editingCommentId === comment._id;

        return (
          <div key={comment._id} className="flex gap-3 group items-start">
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Link to={`/c/${comment.author?.username}`} className="text-[10px] font-extrabold text-slate-200 hover:text-indigo-400 transition-colors">
                    {comment.author?.fullName || "Anonymous User"}
                  </Link>
                  <span className="text-[9px] text-slate-500 font-medium">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Secure Operations Block: Only rendered if item belongs to user */}
                {isCommentOwner && !isCurrentlyEditing && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingCommentId(comment._id);
                        setEditText(comment.content);
                      }}
                      className="text-[9px] font-bold text-slate-400 hover:text-indigo-400 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this comment?")) {
                          deleteCommentMutation.mutate(comment._id);
                        }
                      }}
                      className="text-[9px] font-bold text-rose-500 hover:text-rose-400 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
              
              {/* Dynamic Switch: Renders either the text display or the raw editor form layout */}
              {isCurrentlyEditing ? (
                <div className="space-y-1.5 pt-1">
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs px-2 py-1 rounded-md outline-none focus:border-indigo-500"
                  />
                  <div className="flex gap-1.5 justify-end">
                    <button
                      onClick={() => setEditingCommentId(null)}
                      className="text-[9px] font-bold px-2 py-1 text-slate-400 hover:text-slate-300 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => updateCommentMutation.mutate({ commentId: comment._id, content: editText })}
                      disabled={updateCommentMutation.isPending || !editText.trim()}
                      className="bg-indigo-600 text-white text-[9px] font-bold px-2 py-1 rounded-md hover:bg-indigo-500 transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] leading-relaxed text-slate-300 font-medium break-words">
                  {comment.content}
                </p>
              )}
              
              {/* Like / Toggle Button Layout */}
              {!isCurrentlyEditing && (
                <div className="flex items-center gap-3 pt-1">
                  <button
                    onClick={() => {
                      if (!isLoggedIn) {
                        navigate("/login");
                        return;
                      }
                      toggleCommentLikeMutation.mutate(comment._id);
                    }}
                    disabled={toggleCommentLikeMutation.isPending}
                    className={`text-[10px] font-bold flex items-center gap-1 transition-colors ${
                      comment.isLikedLocal 
                        ? "text-rose-500 hover:text-rose-400" 
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 24 24" 
                      fill={comment.isLikedLocal ? "currentColor" : "none"} 
                      stroke="currentColor" 
                      className="w-3.5 h-3.5 stroke-[2.5]"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                    </svg>
                    <span>{comment.likesCount || 0}</span>
                  </button>
                </div>
              )}

            </div>
          </div>
        );
      })}
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