import { useState, useEffect, useRef, useCallback } from "react";
import { Container, Button, Spinner, Alert } from "react-bootstrap";
import RunsTable from "./RunsTable";
import PlotArea from "./PlotArea";
import RunParameterSelector from "./RunParameterSelector";
import BottomControls from "./BottomControls";
import { fetchPlotData, fetchRuns } from "../api";

const PANEL_WIDTH_KEY = "runsPanelWidth";
const PANEL_VISIBLE_KEY = "runsPanelVisible";

const loadPanelWidth = () => {
  const v = Number(localStorage.getItem(PANEL_WIDTH_KEY));
  return Number.isFinite(v) && v > 200 ? v : 400;
};

export default function Runs({ token }) {
  const [runs, setRuns] = useState([]);
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

  const [loadingRuns, setLoadingRuns] = useState(true);
  const [runsError, setRunsError] = useState("");

  /* ---------------- fetch runs ---------------- */
  const loadRuns = useCallback(async () => {
    if (!token) return;
    setLoadingRuns(true);
    setRunsError("");
    try {
      const data = await fetchRuns(token);
      setRuns(data);
    } catch (err) {
      console.error(err);
      setRunsError("Failed to load runs");
      setRuns([]);
    } finally {
      setLoadingRuns(false);
    }
  }, [token]);

  useEffect(() => {
    loadRuns();
  }, [loadRuns]);

  /* ---------------- auto-select first run ---------------- */
  useEffect(() => {
    if (!loadingRuns && runs.length > 0 && runId === null) {
      setRunId(runs[0].id);
    }
  }, [loadingRuns, runs, runId]);

  /* ---------------- layout helpers ---------------- */
  useEffect(() => {
    if (headerRef.current) {
      const rect = headerRef.current.getBoundingClientRect();
      setHeaderBottom(rect.bottom);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(PANEL_VISIBLE_KEY, JSON.stringify(leftVisible));
  }, [leftVisible]);

  /* ---------------- plot logic ---------------- */
  useEffect(() => {
    setParameter(null);
    setPlotData([]);
  }, [runId]);

  const fetchAndSet = useCallback(async () => {
    if (!runId || !parameter) return;

    setPlotLoading(true);
    try {
      const points = await fetchPlotData(runId, parameter, token);
      setPlotData(points);
      setLastRefresh(new Date());
    } catch (err) {
      console.error(err);
      setPlotData([]);
    } finally {
      setPlotLoading(false);
    }
  }, [runId, parameter, token]);

  useEffect(() => {
    if (!runId || !parameter || refreshSec === 0) return;

    let cancelled = false;
    const wrappedFetch = async () => {
      if (!cancelled) await fetchAndSet();
    };

    wrappedFetch();
    const intervalId = setInterval(wrappedFetch, refreshSec * 1000);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [fetchAndSet, refreshSec, runId, parameter]);

  /* ---------------- resize logic ---------------- */
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

  /* ---------------- render ---------------- */
  return (
    <Container fluid className="p-3" ref={containerRef}>
      <div ref={headerRef} />

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

              {loadingRuns ? (
                <div className="text-center mt-3">
                  <Spinner animation="border" size="sm" /> Loading runs...
                </div>
              ) : runsError ? (
                <Alert variant="danger" className="mt-3">
                  {runsError}
                </Alert>
              ) : (
                <RunsTable
                  runs={runs}
                  selectedRunId={runId}
                  onSelectRun={setRunId}
                />
              )}
            </>
          )}
        </div>

        {leftVisible && (
          <div
            style={{ width: 5, cursor: "col-resize", backgroundColor: "#ddd" }}
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
            <PlotArea
              plotData={plotData}
              parameter={parameter}
              loading={isLoading}
            />
          </div>
        )}
      </div>

      <BottomControls
        refreshSec={refreshSec}
        setRefreshSec={setRefreshSec}
        lastRefresh={lastRefresh}
        onManualRefresh={fetchAndSet}
      />
    </Container>
  );
}
