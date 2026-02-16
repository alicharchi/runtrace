import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute"
import { fetchCurrentUser } from "./api";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [isSuperUser, setIsSuperUser] = useState(
    localStorage.getItem("is_superuser") === "true"
  );
  const [fullName, setFullName] = useState(localStorage.getItem("fullName") || "");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    fetchCurrentUser(token)
      .then((data) => {
        const superUser = data.is_superuser === true;
        const name = `${data.first_name} ${data.last_name}`;

        setIsSuperUser(superUser);
        setFullName(name);

        localStorage.setItem("is_superuser", superUser ? "true" : "false");
        localStorage.setItem("fullName", name);
      })
      .catch((err) => {
        console.error("Token invalid or expired:", err);
        localStorage.clear();
        setToken(null);
        setIsSuperUser(false);
        setFullName("");
      })
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="text-center mt-5">Loading...</div>;

  return (
    <Routes>
      {/* Root redirect */}
      <Route
        path="/"
        element={token ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />}
      />

      {/* Login */}
      <Route
        path="/login"
        element={
          token ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Login
              setToken={setToken}
              setIsSuperUser={setIsSuperUser}
              setFullName={setFullName}
            />
          )
        }
      />

      {/* Dashboard */}
      <Route
        path="/dashboard/*"
        element={
          <ProtectedRoute token={token}>
            <Dashboard
              token={token}
              setToken={setToken}
              isSuperUser={isSuperUser}
              fullName={fullName}
              setFullName={setFullName}
            />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
