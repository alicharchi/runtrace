import Dashboard from "./components/Dashboard";
import { useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import { fetchRuns } from "./api";

export default function App() {
  const [runs, setRuns] = useState([]);

  useEffect(() => {
    fetchRuns().then(setRuns).catch(console.error);
  }, []);

  return (
    <Container fluid className="p-4">
      <h2 className="mb-4">Simulation Viewer</h2>
      <Dashboard runs={runs} />
    </Container>
  );
}
