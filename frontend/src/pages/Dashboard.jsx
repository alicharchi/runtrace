import { Container } from "react-bootstrap";
import { Routes, Route, Navigate } from "react-router-dom";
import AppNavbar from "../components/Navbar";
import Runs from "../components/Runs";
import Users from "../components/Users";
import RequireSuperUser from "../components/RequireSuperUser";

function Welcome() {
  return (
    <div className="text-center mt-5">
      <h2>Welcome to RunTrace</h2>
      <p className="text-muted">
        Choose a section from the navigation bar.
      </p>
    </div>
  );
}

export default function Dashboard({ token, setToken, isSuperUser }) {
  const email = localStorage.getItem("email");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("is_superuser");
    setToken(null);
  };

  return (
    <>
      <AppNavbar
        email={email}
        token={token}
        isSuperUser={isSuperUser} // <-- use state from App.jsx
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
                <Users token={token}/>
              </RequireSuperUser>
            }
          />

          <Route path="*" element={<Navigate to="." replace />} />
        </Routes>
      </Container>
    </>
  );
}
