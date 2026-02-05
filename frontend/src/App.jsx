import { useEffect, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { TopControls, BottomControls } from "./components/Controls";
import Plot from "./components/Plot";
import { fetchRuns, fetchParameters, fetchSeries } from "./api";

export default function App() {
  const [runs, setRuns] = useState([]);
  const [parameters, setParameters] = useState([]);
  const [series, setSeries] = useState({ points: [] }); // single EventsSeries

  const [runId, setRunId] = useState("");
  const [parameter, setParameter] = useState("");
  const [refreshSec, setRefreshSec] = useState(2);  
  const [lastRefresh, setLastRefresh] = useState(null);

  // Initial metadata fetch
  useEffect(() => {
    fetchRuns().then(setRuns);
    fetchParameters().then(setParameters);
  }, []);

  // Polling
  useEffect(() => {
    if (!runId || !parameter) {
      setSeries({ points: [] });
      return;
    }

    const fetchData = () => {
      fetchSeries({ runId, parameter })
        .then((data) => {
          setSeries(data || { points: [] });
          setLastRefresh(new Date());
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
        <Col>
          <TopControls
            runs={runs}
            parameters={parameters}
            runId={runId}
            setRunId={setRunId}
            parameter={parameter}
            setParameter={setParameter}
          />
        </Col>
      </Row>

      <Row className="mb-3">
        <Col>
          <Plot series={series} yVarName={parameter} />
        </Col>
      </Row>      

      <Row>
        <Col>
          <BottomControls
            refreshSec={refreshSec}
            setRefreshSec={setRefreshSec}
            lastRefresh={lastRefresh}
          />
        </Col>
      </Row>
    </Container>
  );
}
