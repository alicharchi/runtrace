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

    async function loadPlot() {
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
    }

    loadPlot();

    return () => {
      cancelled = true;
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
