import React from "react";

export default function Home() {
  // Array array baseline structure mockup to fill visual display layout matrices
  const placeholders = Array.from({ length: 8 });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Recommended Videos</h2>
      </div>

      {/* Video Cards Framework Array Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {placeholders.map((_, i) => (
          <div key={i} className="group flex flex-col space-y-2.5 cursor-pointer">
            {/* Visual Media Thumbnail Box */}
            <div className="aspect-video w-full rounded-2xl bg-gradient-to-br from-indigo-900/20 via-slate-800/40 to-blue-900/20 border border-slate-800/40 relative overflow-hidden transition-all group-hover:border-indigo-500/40 shadow-sm">
              <div className="absolute bottom-2 right-2 bg-black/75 px-1.5 py-0.5 rounded text-[10px] font-bold text-white tracking-wider">
                14:22
              </div>
            </div>

            {/* Video Meta Information Row */}
            <div className="flex gap-3 px-1">
              <div className="w-8 h-8 rounded-full bg-slate-700 shrink-0" />
              <div className="space-y-1 overflow-hidden">
                <h4 className="text-xs font-bold leading-tight truncate group-hover:text-indigo-400 transition-colors">
                  High Performance Full-Stack Architecture Stream #{i + 1}
                </h4>
                <p className="text-[11px] text-slate-400 font-medium truncate">Channel Operator Creator</p>
                <p className="text-[10px] text-slate-500 font-medium">102K views &bull; 2 days ago</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}