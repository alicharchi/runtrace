import { useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import Dashboard from "./components/Dashboard";
import Login from "./components/Login";
import { fetchRuns } from "./api";

export default function App() {
  const [runs, setRuns] = useState([]);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [email, setEmail] = useState(localStorage.getItem("email") || null);

  useEffect(() => {
    if (!token) return;

    fetchRuns(token)
      .then(setRuns)
      .catch(console.error);
  }, [token]);

  if (!token) {
    return (
      <Login
        setToken={(t) => {
          setToken(t);
          localStorage.setItem("token", t);
        }}
        setEmail={(e) => {
          setEmail(e);
          localStorage.setItem("email", e);
        }}
      />
    );
  }
  
  return (
    <Container fluid className="p-4">
      <Dashboard
        runs={runs}
        token={token}
        setToken={setToken}
        email={email}
      />
    </Container>
  );
}
