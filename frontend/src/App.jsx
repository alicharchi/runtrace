import { useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import Dashboard from "./components/Dashboard";
import Login from "./components/Login";
import { fetchRuns } from "./api";

export default function App() {
  const [runs, setRuns] = useState([]);
  const [token, setToken] = useState(localStorage.getItem("token") || null);

  useEffect(() => {
    if (!token) return; 

    fetchRuns(token)
      .then(setRuns)
      .catch(console.error);
  }, [token]);
  
  if (!token) {
    return <Login setToken={setToken} />;
  }

  return (
    <Container fluid className="p-4">      
      <Dashboard runs={runs} token={token} setToken={setToken} />
    </Container>
  );
}
