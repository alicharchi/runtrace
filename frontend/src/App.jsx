import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

export default function App() {
  const [token, setToken] = useState(null);

  // Restore token from localStorage on app start
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) setToken(savedToken);
  }, []);

  return (
    <Routes>
      {/* Redirect root "/" based on token */}
      <Route
        path="/"
        element={
          token ? (
            <Navigate to="/dashboard/runs" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Login route: redirect if already logged in */}
      <Route
        path="/login"
        element={token ? <Navigate to="/dashboard/runs" replace /> : <Login setToken={setToken} />}
      />

      {/* Protected dashboard route */}
      <Route
        path="/dashboard/*"
        element={
          token ? (
            <Dashboard token={token} setToken={setToken} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Catch-all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
