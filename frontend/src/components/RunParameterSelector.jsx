import { Spinner, Button, InputGroup, Form } from "react-bootstrap";

export default function RunParameterSelector({
  selectedRunId,
  parameters = [],
  selectedParameter,
  onParameterChange,
  onParameterDelete,
  loading = false,
}) {
  return (
    <InputGroup size="sm" className="run-parameter-selector" style={{ maxWidth: 300 }}>
      <Form.Select
        value={selectedParameter ?? ""}
        disabled={loading || parameters.length === 0}
        onChange={(e) => onParameterChange(e.target.value || null)}
      >
        {loading && <option value="">Loading parameters...</option>}
        {!loading && parameters.length === 0 && <option value="">No parameters</option>}
        {!loading &&
          parameters.map((param) => (
            <option key={param} value={param}>
              {param}
            </option>
          ))}
      </Form.Select>

      {loading && (
        <InputGroup.Text>
          <Spinner animation="border" size="sm" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </InputGroup.Text>
      )}

      {!loading && selectedParameter && (
        <Button
          variant="outline-danger"
          title="Delete Parameter"
          onClick={() => onParameterDelete(selectedRunId, selectedParameter)}
        >
          <i className="bi bi-trash" />
        </Button>
      )}
    </InputGroup>
  );
}