import { Table, Button } from "react-bootstrap";

export default function RunsTable({ runs, onSelectRun, selectedRunId }) {
  return (
    <div>
      <h5 className="mb-2">Runs</h5>
      <Table striped bordered hover size="sm" responsive>
        <thead>
          <tr>
            <th>ID</th>
            <th>Status</th>
            <th>Exit</th>
            <th>User</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {runs.map((run) => (
            <tr
              key={run.id}
              style={{
                backgroundColor:
                  run.id === selectedRunId ? "#e9f2ff" : undefined,
                fontWeight:
                  run.id === selectedRunId ? "600" : "normal",
              }}
            >
              <td>{run.id}</td>
              <td>{run.status}</td>
              <td>{run.exitflag}</td>
              <td>{run.user_id}</td>
              <td>
                <Button
                  size="sm"
                  variant={run.id === selectedRunId ? "primary" : "outline-primary"}
                  onClick={() => onSelectRun(run.id)}
                >
                  Select
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
