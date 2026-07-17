import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import apiClient from "../utils/api";

export default function Channel() {
  const { username } = useParams();
  const navigate = useNavigate();
  
  // ◄── FIX 1: Corrected initialization identifier name to match the onSuccess execution call block
  const queryClient = useQueryClient(); 

  // Check active viewer state from local storage token block
  const storedUser = JSON.parse(localStorage.getItem("user") || "null");
  const isLoggedIn = !!storedUser;

  // Query 1: Fetch Profile Header Configurations
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", username?.toLowerCase()],
    queryFn: async () => {
      const response = await apiClient.get(`/users/c/${username?.toLowerCase()}`);
      return response.data.data;
    },
    enabled: !!username,
  });

  const toggleSubscriptionMutation = useMutation({
    mutationFn: async (channelId) => {
      const response = await apiClient.post(`/subscriptions/c/${channelId}`);
      return response.data.data; 
    },
    // ◄── FIX 2: Added structural checks ensuring data payload values parse correctly
    onSuccess: (data) => {
      const isSubscribed = data?.isSubscribed;
      
      // Dynamically adjust the cached channel header profile query state instantly
      queryClient.setQueryData(["profile", username?.toLowerCase()], (oldProfile) => {
        if (!oldProfile) return oldProfile;
        return {
          ...oldProfile,
          isSubscribedLocal: isSubscribed,
          subscribersCount: isSubscribed 
            ? (oldProfile.subscribersCount || 0) + 1 
            : Math.max(0, (oldProfile.subscribersCount || 0) - 1),
        };
      });
    },
  });

  // Query 2: Fetch Creator's Custom Library matching your backend endpoint structure
  const { data: videos = [], isLoading: videosLoading } = useQuery({
    queryKey: ["channelVideos", username?.toLowerCase()],
    queryFn: async () => {
      const response = await apiClient.get(`/videos/c/${username?.toLowerCase()}`);
      return response.data.data || [];
    },
    enabled: !!username,
  });

  if (profileLoading || videosLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-white max-w-7xl mx-auto p-4">
      {/* Cover Banner Display Frame */}
      <div className="h-32 sm:h-48 w-full rounded-2xl bg-gradient-to-r from-slate-800 to-indigo-950 overflow-hidden relative border border-slate-800/40">
        {profile?.coverImage && (
          <img src={profile.coverImage} alt="Cover" className="w-full h-full object-cover" />
        )}
      </div>

      {/* Main Channel Metadata Hub */}
      <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-end justify-between px-4 relative -mt-12 sm:-mt-16 pb-4 border-b border-slate-800/40">
        <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-end">
          {/* Profile Avatar Frame */}
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-[#07080c] shadow-xl bg-slate-800 shrink-0 flex items-center justify-center overflow-hidden relative">
            {profile?.avatar && (profile.avatar.startsWith("http://") || profile.avatar.startsWith("https://")) ? (
              <img 
                src={profile.avatar} 
                alt="Avatar" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-xl sm:text-2xl font-black text-white uppercase">
                {profile?.username?.substring(0, 2) || "CH"}
              </div>
            )}
          </div>

          <div className="text-center sm:text-left space-y-1 mb-2">
            <h2 className="text-2xl font-black tracking-tight">{profile?.fullName}</h2>
            <p className="text-xs text-slate-400 font-medium">@{profile?.username}</p>
            <p className="text-xs text-slate-500 font-semibold">
              {profile?.subscribersCount || 0} Subscribers &bull; {profile?.channelsSubscribedToCount || 0} Subscribed
            </p>
          </div>
        </div>

        {/* DYNAMIC CHANNEL ACTION BUTTON */}
        {/* DYNAMIC CHANNEL ACTION BUTTON */}
{storedUser?._id !== profile?._id && (
  <button
    onClick={() => {
      if (!isLoggedIn) {
        navigate("/login");
        return;
      }
      toggleSubscriptionMutation.mutate(profile?._id);
    }}
    disabled={toggleSubscriptionMutation.isPending}
    className={`text-xs font-bold px-6 py-2 rounded-full transition-all tracking-wide shadow-sm mb-2 select-none cursor-pointer ${
      (isLoggedIn && profile?.isSubscribedLocal)
        ? "bg-slate-800 text-slate-400 border border-slate-700/50 hover:bg-rose-950/20 hover:text-rose-400 hover:border-rose-900/30"
        : "bg-indigo-600 text-white hover:bg-indigo-500"
    }`}
  >
    {toggleSubscriptionMutation.isPending 
      ? "Processing..." 
      : (isLoggedIn && profile?.isSubscribedLocal)
        ? "Subscribed" 
        : "Subscribe"
    }
  </button>
)}
      </div>

      {/* Published Library Grid Layout */}
      <div className="space-y-4 pt-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400 px-1">Uploaded Videos</h3>
        
        {videos.length === 0 ? (
          <div className="text-xs text-slate-500 py-12 text-center bg-slate-900/10 border border-dashed border-slate-800/40 rounded-2xl italic">
            This creator hasn't published any videos yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {videos.map((video) => (
              <div 
                key={video._id}
                onClick={() => navigate(`/watch/${video._id}`)}
                className="group flex flex-col space-y-2 cursor-pointer"
              >
                <div className="aspect-video w-full rounded-xl bg-slate-800 overflow-hidden relative border border-slate-800/40 group-hover:border-indigo-500/40 transition-all shadow-md">
                  <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
                </div>
                <div className="px-1 space-y-0.5">
                  <h4 className="text-xs font-bold leading-tight truncate text-slate-200 group-hover:text-indigo-400 transition-colors">
                    {video.title}
                  </h4>
                  <p className="text-[10px] text-slate-500 font-medium">{video.views} views</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}