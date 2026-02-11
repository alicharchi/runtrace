import { Container } from "react-bootstrap";
import { Routes, Route, Navigate } from "react-router-dom";
import AppNavbar from "../components/Navbar";
import Runs from "../components/Runs";

export default function Dashboard({ token, setToken }) {
  const email = localStorage.getItem("email");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    setToken(null);
  };

  return (
    <>
      {/* Pass token, setToken, email, and onLogout to Navbar */}
      <AppNavbar email={email} token={token} onLogout={handleLogout} />
      <Container fluid className="mt-3">
        <Routes>
          <Route path="runs" element={<Runs token={token} />} />
          <Route path="*" element={<Navigate to="runs" replace />} />
        </Routes>
      </Container>
    </>
  );
}
