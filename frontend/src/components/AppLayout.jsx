import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function AppLayout({ children, isDarkMode, toggleTheme }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();

  // Mock user profile data
  const [user] = useState({
    username: "himanshu",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop"
  });

  const handleLogout = () => {
    navigate("/login");
  };

  // Structured array mapping out clean SVGs and dynamic text parameters
  const navItems = [
    {
      label: "Home Feed",
      path: "/home",
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h3m-6 0a1 1 0 001-1v-4a1 1 0 00-1-1h-2a1 1 0 00-1 1v4a1 1 0 001 1" />
        </svg>
      )
    },
    {
      label: "My Channel",
      path: `/c/${user.username}`,
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      label: "Subscriptions",
      path: "/subscriptions",
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      label: "Playlists",
      path: "/playlists",
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )
    },
    {
      label: "Watch History",
      path: "/history",
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ];

  return (
    <div className={`h-screen w-screen flex flex-col overflow-hidden transition-colors duration-300 ${
      isDarkMode ? "bg-[#07080c] text-slate-100" : "bg-[#f8fafc] text-slate-900"
    }`}>
      
      {/* TOP NAVIGATION BAR */}
      <header className={`h-16 border-b flex items-center justify-between px-4 shrink-0 transition-colors z-30 ${
        isDarkMode ? "bg-[#0d0e15] border-slate-800/80" : "bg-white border-slate-200 shadow-sm"
      }`}>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-2 rounded-lg cursor-pointer hover:bg-opacity-80 transition-colors ${
              isDarkMode ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-600"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <Link to="/home" className="flex items-center gap-2">
            <svg className="w-7 h-7" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M75 43.3013C81.6667 47.1503 81.6667 56.8497 75 60.6987L37.5 82.3506C30.8333 86.1996 22.5 81.35 22.5 73.6519L22.5 30.3481C22.5 22.65 30.8333 17.8004 37.5 21.6494L75 43.3013Z" fill="url(#layoutLogoGrad)" />
              <path d="M42 39.6603C44.2222 40.9434 44.2222 44.1593 42 45.4424L32 51.2167C29.7778 52.4998 27 50.8918 27 48.3245L27 36.7782C27 34.211 29.7778 32.603 32 33.8861L42 39.6603Z" fill="white" />
              <defs>
                <linearGradient id="layoutLogoGrad" x1="22.5" y1="15" x2="85" y2="85" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#6366f1" />
                  <stop offset="1" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </svg>
            <span className={`text-base font-black tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              view<span className="text-indigo-400">deo</span>
            </span>
          </Link>
        </div>

        {/* Global Search Bar */}
        <div className="hidden sm:flex max-w-md w-full mx-4">
          <div className="relative w-full">
            <input 
              type="text"
              placeholder="Search content creators, video tags..."
              className={`w-full text-xs font-medium rounded-xl pl-4 pr-10 py-2 border transition-all focus:outline-none focus:ring-1 focus:ring-indigo-500/20 ${
                isDarkMode 
                  ? "bg-[#161925] border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500" 
                  : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:bg-white"
              }`}
            />
            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 cursor-pointer hover:text-indigo-500 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-xl border transition-all duration-150 cursor-pointer shadow-sm ${
              isDarkMode ? "bg-[#161925] border-slate-800 text-amber-400" : "bg-slate-50 border-slate-200 text-indigo-600"
            }`}
          >
            {isDarkMode ? (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707m2.828 5.657a4 4 0 118 0 4 4 0 01-8 0z" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
          
          <button 
            onClick={handleLogout}
            className="hidden xs:block bg-slate-800/40 hover:bg-slate-800 border border-slate-700/60 text-slate-300 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all cursor-pointer"
          >
            Log Out
          </button>

          <Link 
            to={`/c/${user.username}`} 
            className="h-8 w-8 rounded-full overflow-hidden border border-indigo-500/30 hover:border-indigo-500 transition-all duration-200 shadow-sm shrink-0 cursor-pointer hover:scale-105"
            title="View your channel"
          >
            <img 
              src={user.avatar} 
              alt="User profile avatar" 
              className="h-full w-full object-cover"
            />
          </Link>
        </div>
      </header>

      {/* BODY ARCHITECTURE */}
      <div className="flex w-full h-full overflow-hidden relative">
        
        {/* REFACTORED SIDEBAR NAVIGATION BLOCK */}
        <aside className={`h-full border-r shrink-0 transition-all duration-300 overflow-y-auto flex flex-col items-center p-3 ${
          isSidebarOpen ? "w-64" : "w-16"
        } ${isDarkMode ? "bg-[#0d0e15] border-slate-800/60" : "bg-white border-slate-200"}`}>
          <nav className="space-y-2 w-full">
            {navItems.map((item, index) => {
              // Highlight the first element to mock an active home state route layout
              const isActive = index === 0;
              return (
                <Link
                  key={index}
                  to={item.path}
                  className={`flex items-center rounded-xl text-xs font-semibold transition-all cursor-pointer group ${
                    isSidebarOpen ? "px-4 py-3 gap-3 w-full" : "p-3 justify-center mx-auto w-10 h-10"
                  } ${
                    isActive
                      ? isDarkMode ? "bg-indigo-950/40 text-indigo-400" : "bg-indigo-50 text-indigo-700"
                      : isDarkMode ? "text-slate-400 hover:bg-slate-800/50 hover:text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                  title={!isSidebarOpen ? item.label : undefined}
                >
                  {/* Clean upscaled inline SVG icon template */}
                  <div className="transform group-hover:scale-105 transition-transform duration-150">
                    {item.icon}
                  </div>
                  {isSidebarOpen && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* PRIMARY MAIN LAYOUT FRAME */}
        <main className="flex-1 h-full overflow-y-auto p-6 md:p-8 relative">
          {children}
        </main>
      </div>

    </div>
  );
}