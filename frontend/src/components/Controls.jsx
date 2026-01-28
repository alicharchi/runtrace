import { useEffect, useState } from "react";
import { Row, Col, Form } from "react-bootstrap"; // ✅ Bootstrap form components

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
    <Form>
      <Row className="align-items-center">
        <Col xs="12" md="4" className="mb-2">
          <Form.Group>
            <Form.Label>Run</Form.Label>
            <Form.Select value={runId} onChange={(e) => setRunId(e.target.value)}>
              <option value="">Select run</option>
              {runs.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.id}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>

        <Col xs="12" md="4" className="mb-2">
          <Form.Group>
            <Form.Label>Parameter</Form.Label>
            <Form.Select value={parameter} onChange={(e) => setParameter(e.target.value)}>
              <option value="">Select parameter</option>
              {parameters.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>

        <Col xs="12" md="4" className="mb-2">
          <Form.Group>
            <Form.Label>Refresh (seconds)</Form.Label>
            <Form.Select
              value={localRefresh}
              onChange={(e) => setLocalRefresh(Number(e.target.value))}
            >
              {[1, 2, 5, 10].map((v) => (
                <option key={v} value={v}>
                  {v}s
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>
    </Form>
  );
}
