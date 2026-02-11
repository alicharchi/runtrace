import { useState, useEffect, useRef } from "react";
import { Row, Col, Container, Button } from "react-bootstrap";
import RunsTable from "./RunsTable";
import PlotArea from "./PlotArea";
import RunParameterSelector from "./RunParameterSelector";
import BottomControls from "./BottomControls";
import { fetchPlotData } from "../api";

const PANEL_WIDTH_KEY = "runsPanelWidth";
const PANEL_VISIBLE_KEY = "runsPanelVisible";

const loadPanelWidth = () => {
  const v = Number(localStorage.getItem(PANEL_WIDTH_KEY));
  return Number.isFinite(v) && v > 200 ? v : 400;
};

export default function Dashboard({ runs, token, setToken, email }) {
  const [runId, setRunId] = useState(null);
  const [parameter, setParameter] = useState(null);

  const [plotData, setPlotData] = useState([]);
  const [plotLoading, setPlotLoading] = useState(false);

  const [refreshSec, setRefreshSec] = useState(5);
  const [lastRefresh, setLastRefresh] = useState(null);

  const [leftWidth, setLeftWidth] = useState(loadPanelWidth);
  const [isResizing, setIsResizing] = useState(false);
  const [leftVisible, setLeftVisible] = useState(
    JSON.parse(localStorage.getItem(PANEL_VISIBLE_KEY) ?? "true")
  );

  const containerRef = useRef(null);
  const headerRef = useRef(null);
  const [headerBottom, setHeaderBottom] = useState(0);

  useEffect(() => {
    if (headerRef.current) {
      const rect = headerRef.current.getBoundingClientRect();
      setHeaderBottom(rect.bottom);
    }
  }, []);
  
  useEffect(() => {
    localStorage.setItem(PANEL_VISIBLE_KEY, JSON.stringify(leftVisible));
  }, [leftVisible]);

  useEffect(() => {
    setParameter(null);
    setPlotData([]);
  }, [runId]);
  
  useEffect(() => {
    if (!runId || !parameter) {
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
  
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      const containerLeft = containerRef.current.getBoundingClientRect().left;
      const newWidth = e.clientX - containerLeft;
      if (newWidth > 200 && newWidth < 800) setLeftWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (!isResizing) return;
      localStorage.setItem(PANEL_WIDTH_KEY, leftWidth);
      setIsResizing(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, leftWidth]);

  const isLoading = plotLoading && !!parameter;

  return (
    <Container fluid className="p-3" ref={containerRef}>      
      <Row
        ref={headerRef}
        className="align-items-center mb-4 shadow-sm rounded p-3"
        style={{ backgroundColor: "white", position: "sticky", top: 0, zIndex: 1000 }}
      >
        <Col xs="12" sm={8}>
          <h2 className="m-0">Parameter Viewer</h2>
        </Col>
        <Col sm={4} className="text-end d-flex justify-content-end gap-2">
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
      
      {!leftVisible && (
        <div
          style={{
            position: "fixed",
            top: headerBottom + 10,
            left: 0,
            zIndex: 1100,
          }}
        >
          <Button
            variant="secondary"
            size="sm"
            title="Show Runs Panel"
            style={{
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
              borderTopRightRadius: 8,
              borderBottomRightRadius: 8,
              padding: "6px 10px",
            }}
            onClick={() => setLeftVisible(true)}
          >
            ☰
          </Button>
        </div>
      )}

      <div style={{ display: "flex", height: "calc(100vh - 120px)" }}>
        <div
          style={{
            width: leftVisible ? leftWidth : 0,
            minWidth: leftVisible ? 200 : 0,
            borderRight: leftVisible ? "2px solid #ccc" : "none",
            overflowY: "auto",
            position: "relative",
            transition: "width 0.3s ease",
          }}
        >
          {leftVisible && (
            <>
              <Button
                variant="light"
                size="sm"
                title="Hide Runs Panel"
                style={{ position: "absolute", top: 5, right: 5, zIndex: 10 }}
                onClick={() => setLeftVisible(false)}
              >
                ×
              </Button>

              <RunsTable
                runs={runs}
                selectedRunId={runId}
                onSelectRun={(id) => {
                  setRunId(id);
                  setLeftVisible(true);
                }}
              />
            </>
          )}
        </div>
        
        {leftVisible && (
          <div
            style={{
              width: 5,
              cursor: "col-resize",
              backgroundColor: "#ddd",
            }}
            onMouseDown={() => setIsResizing(true)}
          />
        )}
        
        {runId && (
          <div style={{ flex: 1, overflowY: "auto", paddingLeft: 10 }}>
            <RunParameterSelector
              selectedRunId={runId}
              selectedParameter={parameter}
              onParameterChange={setParameter}
              token={token}
            />
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
