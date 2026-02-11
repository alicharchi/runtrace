import { Row, Col, Form, Button } from "react-bootstrap";

export default function BottomControls({
  refreshSec,
  setRefreshSec,
  lastRefresh,
  onManualRefresh,
}) {
  const formatTime = (date) =>
    date ? new Date(date).toLocaleTimeString() : "--:--:--";

  const autoRefreshOff = refreshSec === 0;

  return (
    <Row className="align-items-center mt-3">
      <Col xs="12" md="6">
        <Form.Group className="d-flex align-items-center gap-2">
          <Form.Label className="mb-0" style={{ minWidth: "80px" }}>
            Refresh:
          </Form.Label>

          <Form.Select
            style={{ maxWidth: 140 }}
            value={refreshSec}
            onChange={(e) => setRefreshSec(Number(e.target.value))}
          >
            <option value={0}>Off</option>
            {[1, 2, 5, 10].map((v) => (
              <option key={v} value={v}>
                {v}s
              </option>
            ))}
          </Form.Select>

          {autoRefreshOff && (
            <Button
              variant="outline-primary"
              size="sm"
              onClick={onManualRefresh}
            >
              Refresh
            </Button>
          )}
        </Form.Group>
      </Col>

      <Col
        xs="12"
        md="6"
        className="d-flex justify-content-md-end align-items-center"
      >
        <span>Last refreshed: {formatTime(lastRefresh)}</span>
      </Col>
    </Row>
  );
}
