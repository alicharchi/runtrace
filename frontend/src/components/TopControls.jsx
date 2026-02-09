import { Row, Col } from "react-bootstrap";
import RunParameterSelector from "./RunParameterSelector";

export default function TopControls({
  runs,
  runId,
  setRunId,
  parameter,
  setParameter,
  setParametersLoading,
  token,
}) {
  return (
    <Row
      className="align-items-center mb-3"
      style={{
        marginTop: "1rem", 
      }}
    >
      <Col xs="12" md="8">
        <RunParameterSelector
          runs={runs}
          selectedRunId={runId}
          selectedParameter={parameter}
          onRunChange={setRunId}
          onParameterChange={setParameter}
          showAllRunsOption={true}
          setLoading={setParametersLoading}
          token={token}
        />
      </Col>
    </Row>
  );
}
