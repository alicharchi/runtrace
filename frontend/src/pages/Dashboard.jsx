import { useEffect } from "react";
import { Container } from "react-bootstrap";
import { Routes, Route, Navigate } from "react-router-dom";
import AppNavbar from "../components/Navbar";
import Runs from "./Runs";
import Users from "./Users";
import RequireSuperUser from "../components/RequireSuperUser";
import Welcome from "./Welcome";
import CurrentUserProfile from "./Profile";

export default function Dashboard({ token, setToken, isSuperUser,fullName, setFullName }) {  
  
  useEffect(() => {
    if (token) {
      const storedName = localStorage.getItem("fullName") || "";
      setFullName(storedName);
    }
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("is_superuser");
    localStorage.removeItem("fullName");
    setToken(null);
    setFullName("");
  };

  return (
    <>
      <AppNavbar
        fullName={fullName}
        token={token}
        isSuperUser={isSuperUser}
        onLogout={handleLogout}
      />

      <Container fluid className="mt-3">
        <Routes>
          <Route index element={<Welcome />} />
          <Route path="runs" element={<Runs token={token} />} />

          <Route
            path="users"
            element={
              <RequireSuperUser isSuperUser={isSuperUser}>
                <Users token={token} />
              </RequireSuperUser>
            }
          />

          <Route
            path="profile"
            element={<CurrentUserProfile token={token} setFullName={setFullName} />}
          />

          <Route path="*" element={<Navigate to="." replace />} />
        </Routes>
      </Container>
    </>
  );
}
