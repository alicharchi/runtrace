import { useState, useEffect, useRef, useCallback } from "react";
import { Container, Button, Spinner, Alert } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";

import RunsTable from "../components/RunsTable";
import PlotArea from "../components/PlotArea";
import RunParameterSelector from "../components/RunParameterSelector";
import BottomControls from "../components/BottomControls";
import RunInfo from "../components/RunInfo";

import {
  fetchPlotData,
  fetchRuns,
  updateRunStatus,
  deleteRun,
  deleteParameter,
  fetchParameters,
} from "../api";

import { API_BASE } from "../config";

const PANEL_WIDTH_KEY = "runsPanelWidth";
const PANEL_VISIBLE_KEY = "runsPanelVisible";

const loadPanelWidth = () => {
  const v = Number(localStorage.getItem(PANEL_WIDTH_KEY));
  return Number.isFinite(v) && v > 200 ? v : 400;
};

export default function Runs({ token }) {
  const { runId: runIdParam } = useParams();
  const navigate = useNavigate();
  const containerRef = useRef(null);

  // ------------------- State -------------------
  const [runs, setRuns] = useState([]);
  const [runId, setRunId] = useState(runIdParam ? Number(runIdParam) : null);
  const [parameters, setParameters] = useState([]);
  const [parameter, setParameter] = useState(null);
  const [plotData, setPlotData] = useState([]);
  const [plotLoading, setPlotLoading] = useState(false);

  const [refreshSec, setRefreshSec] = useState(0);
  const [lastRefresh, setLastRefresh] = useState(null);

  const [leftWidth, setLeftWidth] = useState(loadPanelWidth);
  const [isResizing, setIsResizing] = useState(false);
  const [leftVisible, setLeftVisible] = useState(
    JSON.parse(localStorage.getItem(PANEL_VISIBLE_KEY) ?? "true")
  );

  const [loadingRuns, setLoadingRuns] = useState(true);
  const [runsError, setRunsError] = useState("");

  // ------------------- Load Runs -------------------
const loadRuns = useCallback(async () => {
  if (!token) return;
  setLoadingRuns(true);
  setRunsError("");
  try {
    const data = await fetchRuns(token);
    setRuns(data);
    // refreshSec is now fully user-controlled, do not turn it on automatically
  } catch (err) {
    console.error(err);
    setRunsError("Failed to load runs");
    setRuns([]);
    setRefreshSec(0); // just ensure it's off on load error
  } finally {
    setLoadingRuns(false);
  }
}, [token]);

useEffect(() => {
  loadRuns();
}, [loadRuns]);

// ------------------- SSE for real-time run updates -------------------
useEffect(() => {
  if (!token) return;
  const sseUrl = `${API_BASE}/runs/stream?token=${token}`;
  const eventSource = new EventSource(sseUrl);

  eventSource.onmessage = (event) => {
  try {
    const data = JSON.parse(event.data);

    setRuns((prevRuns) => {
      let updatedRuns = [...prevRuns];

      if (data.type === "run_deleted") {
        updatedRuns = prevRuns.filter((r) => r.id !== data.id);
      } else {
        const idx = prevRuns.findIndex((r) => r.id === data.id);
        if (idx >= 0) {
          updatedRuns[idx] = { ...updatedRuns[idx], ...data };
        } else if (data.type === "run_started" || data.type === "run_completed") {
          updatedRuns.push({
            id: data.id,
            status: data.status,
            time: data.time,
            exitflag: data.exitflag ?? null,
            endtime: data.endtime ?? null,
            user_id: data.user_id ?? null,
            user_email: data.user_email ?? null,
            user_first_name: data.user_first_name ?? null,
            user_last_name: data.user_last_name ?? null,
          });
        }
      }

      // --- Only turn OFF refresh when all runs are done ---
      if (data.type === "run_completed" || data.type === "run_failed") {
        const anyRunning = updatedRuns.some(
          (r) => r.status === "running"
        );
        if (!anyRunning) setRefreshSec(0);
      }

      return updatedRuns;
    });

    // --- Fetch parameters for new run ONLY if it is currently selected ---
    if (data.type === "run_started") {
      setRunId((currentRunId) => {
        // if no run selected yet, select the new run
        if (currentRunId === null) return data.id;
        return currentRunId;
      });

      setRunId((currentRunId) => {
        if (currentRunId === data.id) {
          (async () => {
            try {
              const params = await fetchParameters(data.id, token);
              setParameters(params);
              setParameter(params.length > 0 ? params[0] : null);
            } catch (err) {
              console.error("Failed to fetch parameters for new run", err);
            }
          })();
        }
        return currentRunId;
      });
    }

  } catch (err) {
    console.error("SSE parse error", err);
  }
};

  eventSource.onerror = () => {
    console.warn("SSE connection lost, retrying...");
    eventSource.close();
    setTimeout(() => setRuns((prev) => [...prev]), 3000);
  };

  return () => eventSource.close();
}, [token]);

  // ------------------- URL → state sync -------------------
  useEffect(() => {
    if (runIdParam) {
      const id = Number(runIdParam);
      if (!Number.isNaN(id)) setRunId(id);
    }
  }, [runIdParam]);

  // ------------------- Update run status -------------------
  const handleUpdateRunStatus = async (runId, newStatus) => {
    try {
      await updateRunStatus(runId, newStatus, token);
      await loadRuns();
    } catch (err) {
      console.error("Failed to update run status", err);
    }
  };

  // ------------------- Delete Run -------------------
  const handleDeleteRun = async (runId) => {
    if (!window.confirm(`Are you sure you want to delete run "${runId}"?`)) return;

    setRuns((prev) => prev.filter((r) => r.id !== runId));
    setRunId((current) => {
      if (current === runId) {
        navigate("/dashboard/runs", { replace: true });
        return null;
      }
      return current;
    });

    try {
      await deleteRun(runId, token);
    } catch (err) {
      alert(`Failed to delete run: ${err.message}`);
      loadRuns();
    }
  };

  // ------------------- Delete Parameter -------------------
  const handleDeleteParameter = async (runId, paramName) => {
    if (!paramName) return;
    if (!window.confirm(`Are you sure you want to delete parameter "${paramName}" from run "${runId}"?`)) return;

    try {
      await deleteParameter(runId, paramName, token);

      setParameters((prev) => {
        const updated = prev.filter((p) => p !== paramName);
        const nextParam = updated.length > 0 ? updated[0] : null;
        setParameter((current) => (current === paramName ? nextParam : current));
        if (!nextParam) setPlotData([]);
        return updated;
      });
    } catch (err) {
      console.error("Failed to delete parameter:", err);
      alert("Failed to delete parameter");
    }
  };

  // ------------------- Auto-select first run -------------------
  useEffect(() => {
    if (!loadingRuns && runs.length > 0 && runId === null && !runIdParam) {
      const id = runs[0].id;
      setRunId(id);
      navigate(`/dashboard/runs/${id}`, { replace: true });
    }
  }, [loadingRuns, runs, runId, runIdParam, navigate]);

  // ------------------- Panel visibility persistence -------------------
  useEffect(() => localStorage.setItem(PANEL_VISIBLE_KEY, JSON.stringify(leftVisible)), [leftVisible]);

  // ------------------- Fetch parameters for selected run -------------------
  useEffect(() => {
    if (!runId || !token) return;

    const loadParameters = async () => {
      try {
        const data = await fetchParameters(runId, token);
        setParameters(data);
        setParameter(data.length > 0 ? data[0] : null);
      } catch (err) {
        console.error("Failed to fetch parameters:", err);
        setParameters([]);
        setParameter(null);
      }
    };

    loadParameters();
  }, [runId, token]);

  // ------------------- Fetch plot data -------------------
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
    fetchAndSet();
  }, [runId, parameter, fetchAndSet]);

  // ------------------- Auto-refresh -------------------
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

  // ------------------- Resizer -------------------
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing || !containerRef.current) return;
      const containerLeft = containerRef.current.getBoundingClientRect().left;
      const newWidth = e.clientX - containerLeft;
      if (newWidth > 200 && newWidth < window.innerWidth - 200) setLeftWidth(newWidth);
    };
    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
        localStorage.setItem(PANEL_WIDTH_KEY, leftWidth);
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, leftWidth]);

  // ------------------- Render -------------------
  return (
    <Container fluid className="p-3" ref={containerRef}>
      <div style={{ display: "flex", height: "calc(100vh - 120px)" }}>
        {/* Left Panel */}
        <div
          style={{
            width: leftVisible ? leftWidth : 0,
            minWidth: leftVisible ? 200 : 0,
            borderRight: leftVisible ? "2px solid #ccc" : "none",
            overflowY: "auto",
            position: "relative",
            transition: "width 0.2s ease",
          }}
        >
          {leftVisible && (
            <>
              {/* Close button */}
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
                  onUpdateRunStatus={handleUpdateRunStatus}
                  onSelectRun={(id) => {
                    setRunId(id);
                    navigate(`/dashboard/runs/${id}`);
                  }}
                  onDeleteRun={handleDeleteRun}
                />
              )}
            </>
          )}
        </div>

        {/* Resizer */}
        {leftVisible && (
          <div
            style={{ width: 5, cursor: "col-resize", backgroundColor: "#ddd" }}
            onMouseDown={() => setIsResizing(true)}
          />
        )}

        {/* Show button when panel hidden */}
        {!leftVisible && (
          <Button
            variant="secondary"
            size="sm"
            style={{ position: "absolute", top: 10, left: 10, zIndex: 10 }}
            onClick={() => setLeftVisible(true)}
          >
            Show Runs Panel
          </Button>
        )}

        {/* Right Panel */}
        {runId && (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              paddingLeft: 10,
              overflow: "hidden",
            }}
          >
            <div style={{ marginBottom: "1rem" }}>
              <RunParameterSelector
                selectedRunId={runId}
                selectedParameter={parameter}
                parameters={parameters}
                onParameterChange={setParameter}
                onParameterDelete={handleDeleteParameter}
                token={token}
              />
            </div>

            <PlotArea plotData={plotData} parameter={parameter} loading={plotLoading} />

            <div
              style={{
                flex: 1,
                overflowY: "auto",
                marginTop: "1rem",
                paddingBottom: "80px",
              }}
            >
              <RunInfo runId={runId} token={token} />
            </div>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <BottomControls
        refreshSec={refreshSec}
        setRefreshSec={setRefreshSec}
        lastRefresh={lastRefresh}
        onManualRefresh={fetchAndSet}
      />
    </Container>
  );
}