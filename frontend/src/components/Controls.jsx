import { useEffect, useState } from "react";

export default function Controls({
  runs,
  parameters,
  runId,
  setRunId,
  parameter,
  setParameter,
  refreshSec,
  setRefreshSec,
}) {
  const [localRefresh, setLocalRefresh] = useState(refreshSec);

  // Debounce refresh changes
  useEffect(() => {
    const id = setTimeout(() => {
      setRefreshSec(localRefresh);
    }, 500);
    return () => clearTimeout(id);
  }, [localRefresh]);

  return (
    <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
      <label>
        Run:
        <select value={runId} onChange={e => setRunId(e.target.value)}>
          <option value="">Select run</option>
          {runs.map(r => (
            <option key={r.id} value={r.id}>{r.id}</option>
          ))}
        </select>
      </label>

      <label>
        Parameter:
        <select value={parameter} onChange={e => setParameter(e.target.value)}>
          <option value="">Select parameter</option>
          {parameters.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </label>

      <label>
        Refresh:
        <select
          value={localRefresh}
          onChange={e => setLocalRefresh(Number(e.target.value))}
        >
          {[1, 2, 5, 10].map(v => (
            <option key={v} value={v}>{v}s</option>
          ))}
        </select>
      </label>
    </div>
  );
}
