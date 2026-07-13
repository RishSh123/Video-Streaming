import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import AppLayout from "./components/AppLayout";
import Home from "./pages/Home";

function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  return (
    <Router>
      <div className={`min-h-screen w-screen transition-colors duration-300 ${
        isDarkMode ? "bg-[#07080c]" : "bg-[#f8fafc]"
      }`}>
        <Routes>
          <Route path="/" element={<Navigate to="/register" replace />} />
          
          <Route 
            path="/register" 
            element={<Register isDarkMode={isDarkMode} toggleTheme={toggleTheme} />} 
          />
          
          <Route 
            path="/login" 
            element={<Login isDarkMode={isDarkMode} toggleTheme={toggleTheme} />} 
          />


          <Route 
            path="/home" 
            element={
              <AppLayout isDarkMode={isDarkMode} toggleTheme={toggleTheme}>
                <Home />
              </AppLayout>
            } 
          />


          <Route 
            path="/c/:username" 
            element={
              <AppLayout isDarkMode={isDarkMode} toggleTheme={toggleTheme}>
                <div className="space-y-4">
                  <h2 className="text-xl font-bold">User Profile & Channel Page</h2>
                  <p className="text-xs text-slate-400">This placeholder page will query and list your uploaded streams and account details.</p>
                </div>
              </AppLayout>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;