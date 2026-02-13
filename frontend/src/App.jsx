import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import { API_BASE } from "./config";

export default function App() {
  const [token, setToken] = useState(null);
  const [isSuperUser, setIsSuperUser] = useState(false);
  const [loading, setLoading] = useState(true); // wait until we know superuser status

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (!savedToken) {
      setLoading(false);
      return;
    }

    setToken(savedToken);

    const savedSuperUser = localStorage.getItem("is_superuser");
    if (savedSuperUser !== null) {
      setIsSuperUser(savedSuperUser === "true");
      setLoading(false);
    } else {

      fetch(`${API_BASE}/users/me`, {
        headers: { Authorization: `Bearer ${savedToken}` },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch user info");
          return res.json();
        })
        .then((data) => {
          const superUser = data.is_superuser === true;
          setIsSuperUser(superUser);
          localStorage.setItem("is_superuser", superUser ? "true" : "false");
        })
        .catch((err) => {
          console.error(err);
          localStorage.removeItem("token");
          localStorage.removeItem("email");
          localStorage.removeItem("is_superuser");
          setToken(null);
        })
        .finally(() => setLoading(false));
    }
  }, []);

  if (loading) {
    return <div className="text-center mt-5">Loading...</div>;
  }

  return (
    <Routes>
      <Route
        path="/"
        element={token ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />}
      />

      <Route
        path="/login"
        element={
          token ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Login setToken={setToken} setIsSuperUser={setIsSuperUser} />
          )
        }
      />

      <Route
        path="/dashboard/*"
        element={
          token ? (
            <Dashboard token={token} setToken={setToken} isSuperUser={isSuperUser} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
