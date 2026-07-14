import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import AppLayout from "./components/AppLayout";
import Home from "./pages/Home";
import Channel from "./pages/Channel";

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
                <Channel />
              </AppLayout>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;