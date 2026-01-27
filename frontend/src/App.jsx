import { useEffect, useState } from "react";
import Controls from "./components/Controls";
import IterToggles from "./components/IterToggles";
import Plot from "./components/Plot";
import { fetchRuns, fetchParameters, fetchSeries } from "./api";

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
        .then(d => {
          setSeries(d || []);

          // auto-enable new iters
          const vis = {};
          (d || []).forEach(s => {
            vis[s.iter] = visibleIters[s.iter] ?? true;
          });
          setVisibleIters(v => ({ ...vis, ...v }));
        })
        .catch(err => console.error(err));
    };

    fetchData();
    const id = setInterval(fetchData, refreshSec * 1000);
    return () => clearInterval(id);
  }, [runId, parameter, refreshSec]);

  return (
    <div style={{ padding: 20 }}>
      <h2>Simulation Viewer</h2>

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

      <IterToggles
        series={series}
        visibleIters={visibleIters}
        setVisibleIters={setVisibleIters}
      />

      <Plot series={series} visibleIters={visibleIters} />
    </div>
  );
}
