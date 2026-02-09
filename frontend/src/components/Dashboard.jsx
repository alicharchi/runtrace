import { useState, useEffect } from "react";
import { Row, Col, Button, Container } from "react-bootstrap";
import TopControls from "./TopControls";
import PlotArea from "./PlotArea";
import BottomControls from "./BottomControls";
import { fetchPlotData } from "../api";

export default function Dashboard({ runs, token, setToken }) {
  const [runId, setRunId] = useState(null);
  const [parameter, setParameter] = useState(null);

  const [parametersLoading, setParametersLoading] = useState(false);
  const [plotData, setPlotData] = useState([]);
  const [plotLoading, setPlotLoading] = useState(false);

  const [refreshSec, setRefreshSec] = useState(5);
  const [lastRefresh, setLastRefresh] = useState(null);
  
  useEffect(() => {
    setParameter(null);
    setPlotData([]);
  }, [runId]);

  useEffect(() => {
    if (!runId || !parameter) {
      setPlotLoading(false);
      setPlotData([]);
      return;
    }

    let cancelled = false;

    const fetchAndSet = async () => {
      setPlotLoading(true);
      try {
        const points = await fetchPlotData(runId, parameter, token);
        if (!cancelled) {
          setPlotData(points);
          setLastRefresh(new Date());
        }
      } catch (err) {
        if (!cancelled) console.error(err);
        if (!cancelled) setPlotData([]);
      } finally {
        if (!cancelled) setPlotLoading(false);
      }
    };

    fetchAndSet();
    const intervalId = setInterval(fetchAndSet, refreshSec * 1000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [runId, parameter, refreshSec, token]);

  const isLoading = plotLoading && !!parameter;

  return (
    <Container fluid className="p-3">
      <Row className="align-items-center mb-4">
        <Col xs="12" sm={8} className="mb-2 mb-sm-0">
          <h2 className="m-0">Parameter Viewer</h2>
        </Col>
        <Col xs="12" sm={4} className="text-sm-end">
          <Button
            variant="secondary"
            onClick={() => {
              localStorage.removeItem("token");
              setToken(null);
            }}
          >
            Logout
          </Button>
        </Col>
      </Row>
      
      <TopControls
        runs={runs}
        runId={runId}
        setRunId={setRunId}
        parameter={parameter}
        setParameter={setParameter}
        setParametersLoading={setParametersLoading}
        token={token}
      />

      <PlotArea plotData={plotData} parameter={parameter} loading={isLoading} />
      
      <BottomControls
        refreshSec={refreshSec}
        setRefreshSec={setRefreshSec}
        lastRefresh={lastRefresh}
      />
    </Container>
  );
}
