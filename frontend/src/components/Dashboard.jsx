import { useState, useEffect } from "react";
import TopControls from "./TopControls";
import PlotArea from "./PlotArea";
import BottomControls from "./BottomControls";
import { fetchPlotData } from "../api";

export default function Dashboard({ runs }) {
  const [runId, setRunId] = useState(null);
  const [parameter, setParameter] = useState(null);

  const [parametersLoading, setParametersLoading] = useState(false);
  const [plotData, setPlotData] = useState([]);
  const [plotLoading, setPlotLoading] = useState(false);

  const [refreshSec, setRefreshSec] = useState(5);
  const [lastRefresh, setLastRefresh] = useState(null);

  // Clear parameter and plot data when run changes
  useEffect(() => {
    setParameter(null);
    setPlotData([]);
  }, [runId]);

  // Auto-refresh plot data
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
        const points = await fetchPlotData(runId, parameter);
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

    // Fetch immediately
    fetchAndSet();

    // Set up interval for periodic refresh
    const intervalId = setInterval(fetchAndSet, refreshSec * 1000);

    // Cleanup
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [runId, parameter, refreshSec]);

  const isLoading = plotLoading && !!parameter;

  return (
    <div>
      <TopControls
        runs={runs}
        runId={runId}
        setRunId={setRunId}
        parameter={parameter}
        setParameter={setParameter}
        setParametersLoading={setParametersLoading}
      />

      <PlotArea plotData={plotData} parameter={parameter} loading={isLoading} />

      <BottomControls
        refreshSec={refreshSec}
        setRefreshSec={setRefreshSec}
        lastRefresh={lastRefresh}
      />
    </div>
  );
}
