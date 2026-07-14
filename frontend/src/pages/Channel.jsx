import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchChannelProfile, fetchChannelVideos } from "../utils/videoApi";

export default function Channel() {
  const { username } = useParams();
  const navigate = useNavigate();

  // Query 1: Fetch Profile Header Configurations
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", username?.toLowerCase()],
    queryFn: () => fetchChannelProfile(username?.toLowerCase()),
  });

  // Query 2: Fetch Creator's Custom Library
  const { data: videos, isLoading: videosLoading } = useQuery({
    queryKey: ["channelVideos", username?.toLowerCase()],
    queryFn: () => fetchChannelVideos(username?.toLowerCase()),
  });

  if (profileLoading || videosLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cover Banner Display Frame */}
      <div className="h-32 sm:h-48 w-full rounded-2xl bg-gradient-to-r from-slate-800 to-indigo-950 overflow-hidden relative border border-slate-800/40">
        {profile?.coverImage && (
          <img src={profile.coverImage} alt="Cover" className="w-full h-full object-cover" />
        )}
      </div>

      {/* Main Channel Metadata Hub */}
      <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-end px-4 relative -mt-12 sm:-mt-16 pb-4 border-b border-slate-800/40">
        {/* Replace the <img> tag inside the circle container near line 42 with this conditional check: */}
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-[#07080c] shadow-xl bg-white shrink-0 flex items-center justify-center overflow-hidden relative">
            {profile?.avatar ? (
                <img 
                src={profile.avatar} 
                alt="Avatar" 
                className="w-full h-full object-cover"
                />
            ) : (
                <svg className="w-20 h-20 text-slate-300 mt-4" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                </svg>
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

      {/* Published Library Grid Layout */}
      <div className="space-y-4 pt-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400">Uploaded Videos</h3>
        
        {videos?.length === 0 ? (
          <div className="text-xs text-slate-500 py-8 text-center">This creator hasn't published any videos yet.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {videos?.map((video) => (
              <div 
                key={video._id}
                onClick={() => navigate(`/watch/${video._id}`)}
                className="group flex flex-col space-y-2 cursor-pointer"
              >
                <div className="aspect-video w-full rounded-xl bg-slate-800 overflow-hidden relative border border-slate-800/40 group-hover:border-indigo-500/40 transition-all">
                  <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                </div>
                <div className="px-1">
                  <h4 className="text-xs font-bold leading-tight truncate group-hover:text-indigo-400 transition-colors">{video.title}</h4>
                  <p className="text-[10px] text-slate-500 font-medium mt-1">{video.views} views</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}