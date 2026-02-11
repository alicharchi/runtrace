import { useEffect, useState } from "react";
import { Spinner } from "react-bootstrap";
import { fetchParameters } from "../api";

export default function RunParameterSelector({
  selectedRunId,
  selectedParameter,
  onParameterChange,
  token,
}) {
  const [parameters, setParameters] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    onParameterChange(null); // reset parameter when run changes
    setParameters([]);
    setLoading(false);

    if (!selectedRunId || !token) return;

    async function loadParameters() {
      setLoading(true);
      try {
        const data = await fetchParameters(selectedRunId, token);
        if (!cancelled) setParameters(data);
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setParameters([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadParameters();

    return () => {
      cancelled = true;
    };
  }, [selectedRunId, token, onParameterChange]);

  return (
    <div className="run-parameter-selector d-flex gap-2 align-items-center">
      <select
        value={selectedParameter ?? ""}
        disabled={loading || parameters.length === 0}
        onChange={(e) => onParameterChange(e.target.value || null)}
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
  );
}
