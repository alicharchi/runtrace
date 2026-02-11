import { useState, useEffect, useRef } from "react";
import { Row, Col, Container, Button } from "react-bootstrap";
import RunsTable from "./RunsTable";
import PlotArea from "./PlotArea";
import RunParameterSelector from "./RunParameterSelector";
import BottomControls from "./BottomControls";
import { fetchPlotData } from "../api";

export default function Dashboard({ runs, token, setToken, email }) {
  const [runId, setRunId] = useState(null);
  const [parameter, setParameter] = useState(null);

  const [parametersLoading, setParametersLoading] = useState(false);
  const [plotData, setPlotData] = useState([]);
  const [plotLoading, setPlotLoading] = useState(false);

  const [refreshSec, setRefreshSec] = useState(5);
  const [lastRefresh, setLastRefresh] = useState(null);

  const [leftWidth, setLeftWidth] = useState(400); // default left width
  const [isResizing, setIsResizing] = useState(false);
  const [leftVisible, setLeftVisible] = useState(true); // left panel visible
  const containerRef = useRef(null);

  // Reset parameter and plot when run changes
  useEffect(() => {
    setParameter(null);
    setPlotData([]);
  }, [runId]);

  // Fetch plot data
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

  // Resizing logic
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      const containerLeft = containerRef.current.getBoundingClientRect().left;
      const newWidth = e.clientX - containerLeft;
      if (newWidth > 200 && newWidth < 800) setLeftWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isResizing) setIsResizing(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  return (
    <Container fluid className="p-3" ref={containerRef}>
      {/* Top Bar */}
      <Row
        className="align-items-center mb-4 shadow-sm rounded p-3"
        style={{ backgroundColor: "white", position: "sticky", top: 0, zIndex: 1000 }}
      >
        <Col xs="12" sm={8} className="mb-2 mb-sm-0">
          <h2 className="m-0">Parameter Viewer</h2>
        </Col>
        <Col
          xs="12"
          sm={4}
          className="text-sm-end d-flex justify-content-sm-end align-items-center gap-2"
        >
          {email && <span className="fw-bold">{email}</span>}
          <Button
            variant="secondary"
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("email");
              setToken(null);
            }}
          >
            Logout
          </Button>
        </Col>
      </Row>

      {/* Main two-column layout */}
      <div style={{ display: "flex", height: "calc(100vh - 120px)", position: "relative" }}>
        {/* Left column: Runs Table */}
        <div
          style={{
            width: leftVisible ? leftWidth : 0,
            minWidth: leftVisible ? 200 : 0,
            maxWidth: 800,
            borderRight: leftVisible ? "2px solid #ccc" : "none",
            position: "relative",
            overflowY: "auto",
            transition: "width 0.3s ease",
          }}
        >
          {leftVisible && (
            <>
              {/* Close button */}
              <Button
                variant="light"
                size="sm"
                style={{ position: "absolute", top: 5, right: 5, zIndex: 10 }}
                onClick={() => setLeftVisible(false)}
              >
                ×
              </Button>

              <RunsTable runs={runs} onSelectRun={(id) => setRunId(id)} />
            </>
          )}
        </div>

        {/* Resize handle */}
        {leftVisible && (
          <div
            style={{
              width: 5,
              cursor: "col-resize",
              backgroundColor: "#ddd",
              transition: "background-color 0.2s",
            }}
            onMouseDown={() => setIsResizing(true)}
          />
        )}

        {/* Right column: Plot Area */}
        {runId && (
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              paddingLeft: leftVisible ? 10 : 0,
              transition: "padding-left 0.3s ease",
            }}
          >
            {/* Floating button to reopen left panel */}
            {!leftVisible && (
              <Button
                variant="secondary"
                size="sm"
                style={{
                  position: "absolute",
                  top: 10,
                  left: 10,
                  zIndex: 20,
                  borderRadius: "50%",
                  width: 35,
                  height: 35,
                  padding: 0,
                }}
                onClick={() => setLeftVisible(true)}
              >
                ☰
              </Button>
            )}

            <div className="mb-3">
              <RunParameterSelector
                runs={runs.filter((r) => r.id === runId)}
                selectedRunId={runId}
                selectedParameter={parameter}
                onRunChange={setRunId}
                onParameterChange={setParameter}
                setLoading={setParametersLoading}
                token={token}
              />
            </div>
            <PlotArea plotData={plotData} parameter={parameter} loading={isLoading} />
          </div>
        )}
      </div>
      
      <BottomControls
        refreshSec={refreshSec}
        setRefreshSec={setRefreshSec}
        lastRefresh={lastRefresh}
      />
    </Container>
  );
}
