import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import apiClient from "../utils/api";

export default function Login({ isDarkMode, toggleTheme }) {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  // Controlled form state parameters
  const [formData, setFormData] = useState({
    usernameOrEmail: "",
    password: "",
  });

  // Handle textual input field changes smoothly
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // React Query Mutation: Handles the asynchronous session establishment pipeline cleanly
  const mutation = useMutation({
    mutationFn: async (credentials) => {
      // Handles parsing backend logic check via login route endpoint
      const response = await apiClient.post("/users/login", {
        // Handle variations if user provides email vs username
        email: credentials.usernameOrEmail.includes("@") ? credentials.usernameOrEmail.trim() : undefined,
        username: !credentials.usernameOrEmail.includes("@") ? credentials.usernameOrEmail.toLowerCase().trim() : undefined,
        password: credentials.password
      });
      return response.data;
    },
    onSuccess: (data) => {
      // Redirect user directly into the video stream dashboard view upon verification
      navigate("/home");
    },
    onError: (err) => {
      setError(err.response?.data?.message || "Invalid authentication credentials.");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    mutation.mutate(formData);
  };

  return (
    <div className="h-screen w-screen flex flex-col md:flex-row overflow-hidden font-sans transition-colors duration-300">
      
      {/* LEFT SIDE: Cinematic Brand Panel (Stays matching with the registration split view) */}
      <div className="hidden md:flex md:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-[#11131e] via-[#0c0d14] to-[#090a0f] border-r border-slate-900/40 relative overflow-hidden h-full">
        <div className="absolute top-[-30%] left-[-20%] w-[90%] h-[90%] rounded-full bg-indigo-500/10 blur-[140px] pointer-events-none" />
        <div className="absolute bottom-[-30%] right-[-10%] w-[80%] h-[80%] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />

        {/* Brand Header Logo */}
        <div className="relative z-10">
          <Link to="/home" className="inline-flex items-center gap-3 group transition-transform duration-200 active:scale-95">
            <svg className="w-9 h-9 transform group-hover:rotate-6 transition-transform duration-300" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M75 43.3013C81.6667 47.1503 81.6667 56.8497 75 60.6987L37.5 82.3506C30.8333 86.1996 22.5 81.35 22.5 73.6519L22.5 30.3481C22.5 22.65 30.8333 17.8004 37.5 21.6494L75 43.3013Z" fill="url(#loginLogoGrad)" />
              <path d="M42 39.6603C44.2222 40.9434 44.2222 44.1593 42 45.4424L32 51.2167C29.7778 52.4998 27 50.8918 27 48.3245L27 36.7782C27 34.211 29.7778 32.603 32 33.8861L42 39.6603Z" fill="white" fillOpacity="0.95" />
              <defs>
                <linearGradient id="loginLogoGrad" x1="22.5" y1="15" x2="85" y2="85" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#6366f1" />
                  <stop offset="1" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </svg>
            <span className="text-xl font-black tracking-tight text-white">
              view<span className="text-indigo-400 font-bold group-hover:text-indigo-300 transition-colors">deo</span>
            </span>
          </Link>
        </div>

        {/* Narrative Copy */}
        <div className="max-w-md space-y-4 my-auto relative z-10">
          <h1 className="text-5xl font-black tracking-tight text-white leading-[1.15]">
            Welcome back to <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
              your dashboard.
            </span>
          </h1>
          <p className="text-slate-400 text-sm font-normal leading-relaxed max-w-sm">
            Log into your viewdeo profile to seamlessly view customized subscription feeds, interact with global streaming channels, and check your saved collections.
          </p>
        </div>

        <div className="text-xs text-slate-600 relative z-10 font-medium">
          &copy; {new Date().getFullYear()} viewdeo Inc. All rights reserved.
        </div>
      </div>

      {/* RIGHT SIDE: Interactive Login Interface Workspace Workspace Container */}
      <div className={`w-full md:w-1/2 flex flex-col justify-center items-center p-6 md:p-12 overflow-y-auto h-full max-h-screen transition-colors duration-300 relative ${
        isDarkMode ? "bg-[#0d0e15]" : "bg-[#f8fafc]"
      }`}>
        
        {/* UPPER RIGHT CORNER: Absolute Fixed Theme Switcher Button Hook */}
        <div className="absolute top-6 right-6 z-20">
          <button
            onClick={toggleTheme}
            type="button"
            className={`p-2.5 rounded-xl border transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 flex items-center justify-center shadow-sm ${
              isDarkMode 
                ? "bg-[#161925] border-slate-800 text-amber-400 hover:bg-[#1f2335]" 
                : "bg-white border-slate-200 text-indigo-600 hover:bg-slate-50"
            }`}
          >
            {isDarkMode ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707m2.828 5.657a4 4 0 118 0 4 4 0 01-8 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>

        <div className="max-w-md w-full my-auto transition-all">
          
          {/* Mobile Display Logo View */}
          <div className="block md:hidden text-center mb-6">
            <Link to="/home" className="inline-flex items-center gap-2.5">
              <svg className="w-7 h-7" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M75 43.3013C81.6667 47.1503 81.6667 56.8497 75 60.6987L37.5 82.3506C30.8333 86.1996 22.5 81.35 22.5 73.6519L22.5 30.3481C22.5 22.65 30.8333 17.8004 37.5 21.6494L75 43.3013Z" fill="url(#mobileLoginLogoGrad)" />
                <path d="M42 39.6603C44.2222 40.9434 44.2222 44.1593 42 45.4424L32 51.2167C29.7778 52.4998 27 50.8918 27 48.3245L27 36.7782C27 34.211 29.7778 32.603 32 33.8861L42 39.6603Z" fill="white" />
                <defs>
                  <linearGradient id="mobileLoginLogoGrad" x1="22.5" y1="15" x2="85" y2="85" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#6366f1" />
                    <stop offset="1" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
              </svg>
              <span className={`text-lg font-black tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                view<span className="text-indigo-400">deo</span>
              </span>
            </Link>
          </div>

          <h2 className={`text-4xl font-bold tracking-tight text-center mb-7 md:text-left transition-colors ${
            isDarkMode ? "text-white" : "text-slate-900"
          }`}>Login to Your Account</h2>
          <p className={`text-xs mb-6 text-center md:text-left transition-colors ${
            isDarkMode ? "text-slate-400" : "text-slate-500"
          }`}>
            
          </p>

          {error && (
            <div className="bg-rose-950/30 border border-rose-900/50 text-rose-300 text-xs p-3 rounded-xl mb-5 text-center font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username or Email Input Field */}
            <div>
              <label className={`block text-[12px] font-bold uppercase tracking-wider mb-1.5 transition-colors ${
                isDarkMode ? "text-slate-400" : "text-slate-600"
              }`}>Username or Email</label>
              <input
                type="text"
                name="usernameOrEmail"
                required
                value={formData.usernameOrEmail}
                onChange={handleInputChange}
                className={`w-full text-xs font-medium rounded-xl px-3.5 py-2.5 transition-all focus:outline-none focus:ring-1 focus:ring-indigo-500/20 shadow-sm border ${
                  isDarkMode 
                    ? "bg-[#161925] border-slate-800/80 text-white placeholder-slate-500 focus:border-indigo-500" 
                    : "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:bg-white"
                }`}
                placeholder="Enter your username or email"
              />
            </div>

            {/* Password Input Field */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className={`block text-[12px] font-bold uppercase tracking-wider transition-colors ${
                  isDarkMode ? "text-slate-400" : "text-slate-600"
                }`}>Password</label>
              </div>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full text-xs font-medium rounded-xl px-3.5 py-2.5 transition-all focus:outline-none focus:ring-1 focus:ring-indigo-500/20 shadow-sm border ${
                  isDarkMode 
                    ? "bg-[#161925] border-slate-800/80 text-white placeholder-slate-500 focus:border-indigo-500" 
                    : "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:bg-white"
                }`}
                placeholder="Enter your password"
              />
            </div>

            {/* Submit Execution Button */}
            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-4 rounded-xl mt-4 cursor-pointer focus:outline-none disabled:bg-indigo-800 transition-all text-s shadow-lg shadow-indigo-600/15 active:scale-[0.99]"
            >
              {mutation.isPending ? "Signing in..." : "Log In"}
            </button>
          </form>

          {/* Routing Redirection Footer Link */}
          <p className="text-center text-xs mt-6 font-medium">
            <span className={isDarkMode ? "text-slate-400" : "text-slate-500"}>Don't have an account yet? </span>
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 transition-colors font-semibold">
              Sign up
            </Link>
          </p>
        </div>
      </div>
      
    </div>
  );
}