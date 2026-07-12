import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Register from "./pages/Register";

function App() {
  return (
    <Router>
      <Routes>
        {/* Set up the default landing route to direct straight into registration for testing */}
        <Route path="/" element={<Navigate to="/register" replace />} />
        
        <Route path="/register" element={<Register />} />
        
        {/* We will build the Login component page next */}
        <Route path="/login" element={<div className="p-8 text-center">Login Page Placeholder</div>} />
      </Routes>
    </Router>
  );
}

export default App;