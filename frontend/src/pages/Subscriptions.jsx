import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../utils/api";

export default function Subscriptions() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const storedUser = JSON.parse(localStorage.getItem("user") || "null");

  // Query: Fetch all channels the current logged-in user follows[cite: 6, 7]
  const { data: channelsList = [], isLoading, isError, error } = useQuery({
    queryKey: ["subscriptions", storedUser?._id],
    queryFn: async () => {
      const response = await apiClient.get(`/subscriptions/u/${storedUser?._id}`);
      return response.data.data || [];
    },
    enabled: !!storedUser?._id,
  });

  // Mutation: Handle dynamic unsubscription directly from this portal[cite: 6, 7]
  const unsubscribeMutation = useMutation({
    mutationFn: async (channelId) => {
      await apiClient.post(`/subscriptions/c/${channelId}`);
      return channelId;
    },
    onSuccess: (channelId) => {
      // Surgically remove the channel from our cache instantly so it disappears smoothly
      queryClient.setQueryData(["subscriptions", storedUser?._id], (oldList = []) => 
        oldList.filter((item) => (item.channel?._id || item.channel) !== channelId)
      );
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 bg-rose-950/20 border border-rose-900/40 rounded-xl text-rose-400 text-xs text-center max-w-xl mx-auto mt-6">
        Error compiling subscriptions: {error.message || "Session error."}
      </div>
    );
  }

  return (
    <div className="space-y-6 text-white max-w-5xl mx-auto p-2">
      {/* Header section with explicit divider line */}
      <div className="border-b border-slate-800/60 pb-4">
        <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Subscribed Channels
        </h2>
      </div>

      {channelsList.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/10 border border-dashed border-slate-800/40 rounded-2xl max-w-xl mx-auto">
          <p className="text-xs text-slate-500 font-medium italic">You haven't subscribed to any channels yet.</p>
          <button 
            onClick={() => navigate("/home")} 
            className="mt-4 text-[11px] bg-indigo-600 hover:bg-indigo-500 font-bold px-4 py-2 rounded-xl transition-all shadow-md cursor-pointer"
          >
            Discover Creators
          </button>
        </div>
      ) : (
        /* Creator Cards Layout Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {channelsList.map((item) => {
            // Safely unpack the aggregated channel structure[cite: 7]
            const channel = item.channel;
            if (!channel) return null;

            return (
              <div 
                key={item._id}
                className="group flex flex-col items-center text-center p-5 rounded-2xl bg-[#0d0e15]/40 border border-slate-900/40 hover:bg-[#121420]/60 hover:border-indigo-500/20 transition-all duration-200 shadow-sm relative overflow-hidden"
              >
                {/* Channel Profile Avatar Circle Frame */}
                <Link 
                  to={`/c/${channel.username}`}
                  className="w-20 h-20 rounded-full bg-slate-800 border border-slate-800/80 overflow-hidden relative shadow-md shrink-0 mb-3 block group-hover:scale-105 transition-transform duration-200"
                >
                  {channel.avatar ? (
                    <img src={channel.avatar} alt={channel.fullName} className="w-full h-full object-cover absolute inset-0" />
                  ) : (
                    <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-lg font-black text-white uppercase">
                      {channel.username?.substring(0, 2)}
                    </div>
                  )}
                </Link>

                {/* Info Metadata Block */}
                <div className="space-y-0.5 w-full mb-4">
                  <Link 
                    to={`/c/${channel.username}`}
                    className="text-xs font-black text-slate-200 hover:text-indigo-400 transition-colors block truncate max-w-full"
                  >
                    {channel.fullName}
                  </Link>
                  <p className="text-[10px] text-slate-500 font-semibold truncate">
                    @{channel.username}
                  </p>
                </div>

                {/* Subscribed Management Button */}
                <button
                  onClick={() => {
                    if (confirm(`Are you sure you want to unsubscribe from @${channel.username}?`)) {
                      unsubscribeMutation.mutate(channel._id);
                    }
                  }}
                  disabled={unsubscribeMutation.isPending}
                  className="w-full text-[10px] font-bold py-1.5 rounded-xl border select-none cursor-pointer bg-slate-800 text-slate-400 border-slate-700/50 hover:bg-rose-950/20 hover:text-rose-400 hover:border-rose-900/30 transition-all"
                >
                  {unsubscribeMutation.isPending ? "Processing..." : "Subscribed"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}