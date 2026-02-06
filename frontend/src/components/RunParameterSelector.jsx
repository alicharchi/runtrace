import { useEffect, useState } from "react";
import { Spinner } from "react-bootstrap";
import { API_BASE } from "../config";

export default function RunParameterSelector({
  runs,
  selectedRunId,
  selectedParameter,
  onRunChange,
  onParameterChange,
  showAllRunsOption = true,
}) {
  const [parameters, setParameters] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch parameters whenever selectedRunId changes
  useEffect(() => {
    let cancelled = false;

    async function fetchParameters() {
      setLoading(true);
      onParameterChange(null); // reset parameter selection

      try {
        const url =
          selectedRunId != null && selectedRunId !== ""
            ? `${API_BASE}/parameters?runid=${selectedRunId}`
            : `${API_BASE}/parameters`;

        const res = await fetch(url);
        if (!res.ok) {
          const text = await res.text();
          console.error("Failed to fetch parameters. Response:", text);
          throw new Error("Failed to fetch parameters");
        }

        const data = await res.json();
        if (!cancelled) setParameters(data);
      } catch (err) {
        if (!cancelled) {
          console.error("Error fetching parameters:", err);
          setParameters([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchParameters();

    return () => {
      cancelled = true;
    };
  }, [selectedRunId, onParameterChange]);

  return (
    <div className="run-parameter-selector d-flex gap-2 align-items-center">
      {/* Run dropdown with spinner */}
      <div className="d-flex align-items-center">
        <select
          value={selectedRunId ?? ""}
          onChange={(e) =>
            onRunChange(e.target.value ? Number(e.target.value) : null)
          }
        >
          {showAllRunsOption && <option value="">All runs</option>}
          {runs.map((run) => (
            <option key={run.id} value={run.id}>
              Run {run.id}
            </option>
          ))}
        </select>
        {loading && (
          <Spinner
            animation="border"
            size="sm"
            role="status"
            className="ms-2"
          >
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        )}
      </div>

      {/* Parameter dropdown */}
      <select
        value={selectedParameter ?? ""}
        disabled={loading || parameters.length === 0}
        onChange={(e) =>
          onParameterChange(e.target.value || null)
        }
      >
        <option value="">
          {loading
            ? "Loading parameters..."
            : parameters.length === 0
              ? "No parameters"
              : "Select parameter"}
        </option>
        {parameters.map((param) => (
          <option key={param} value={param}>
            {param}
          </option>
        ))}
      </select>
    </div>
  );
}
