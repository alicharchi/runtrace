import { Row, Col, Form } from "react-bootstrap";

export default function BottomControls({ refreshSec, setRefreshSec, lastRefresh }) {
  const formatTime = (date) =>
    date ? new Date(date).toLocaleTimeString() : "--:--:--";

  return (
    <Row className="align-items-center mt-3">
      <Col xs="12" md="4">
        <Form.Group className="d-flex align-items-center">
          <Form.Label className="me-2 mb-0" style={{ minWidth: "80px" }}>
            Refresh:
          </Form.Label>
          <Form.Select
            value={refreshSec}
            onChange={(e) => setRefreshSec(Number(e.target.value))}
          >
            {[1, 2, 5, 10].map((v) => (
              <option key={v} value={v}>
                {v}s
              </option>
            ))}
          </Form.Select>
        </Form.Group>
      </Col>
      <Col xs="12" md="8" className="d-flex justify-content-md-end align-items-center">
        <span>
          Last refreshed: {formatTime(lastRefresh)}
        </span>
      </Col>
    </Row>
  );
}
