import { useEffect, useState } from "react";
import Controls from "./components/Controls";
import IterToggles from "./components/IterToggles";
import Plot from "./components/Plot";
import { fetchRuns, fetchParameters, fetchSeries } from "./api";
import { Container, Row, Col } from "react-bootstrap"; // ✅ Bootstrap layout

export default function App() {
  const [runs, setRuns] = useState([]);
  const [parameters, setParameters] = useState([]);
  const [series, setSeries] = useState([]);

  const [runId, setRunId] = useState("");
  const [parameter, setParameter] = useState("");
  const [refreshSec, setRefreshSec] = useState(2);
  const [visibleIters, setVisibleIters] = useState({});

  // Initial metadata fetch
  useEffect(() => {
    fetchRuns().then(setRuns);
    fetchParameters().then(setParameters);
  }, []);

  // Polling
  useEffect(() => {
    if (!runId || !parameter) return;

    const fetchData = () => {
      fetchSeries({ runId, parameter })
        .then((d) => {
          setSeries(d || []);

          // auto-enable new iters
          const vis = {};
          (d || []).forEach((s) => {
            vis[s.iter] = visibleIters[s.iter] ?? true;
          });
          setVisibleIters((v) => ({ ...vis, ...v }));
        })
        .catch((err) => console.error(err));
    };

    fetchData();
    const id = setInterval(fetchData, refreshSec * 1000);
    return () => clearInterval(id);
  }, [runId, parameter, refreshSec]);

  return (
    <Container fluid className="p-4">
      <h2 className="mb-4">Simulation Viewer</h2>

      <Row className="mb-3">
        <Col xs={12}>
          <Controls
            runs={runs}
            parameters={parameters}
            runId={runId}
            setRunId={setRunId}
            parameter={parameter}
            setParameter={setParameter}
            refreshSec={refreshSec}
            setRefreshSec={setRefreshSec}
          />
        </Col>
      </Row>

      <Row className="mb-3">
        <Col xs={12}>
          <IterToggles
            series={series}
            visibleIters={visibleIters}
            setVisibleIters={setVisibleIters}
          />
        </Col>
      </Row>

      <Row>
        <Col xs={12}>
          <Plot series={series} visibleIters={visibleIters} yVarName={parameter} />
        </Col>
      </Row>
    </Container>

  );
}
