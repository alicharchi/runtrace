import { Table, Button } from "react-bootstrap";
import RunStatus from "./RunStatus";
import { formatDateTime, calculateDuration } from "../utils";

export default function RunsTable({
  runs = [],
  onSelectRun = () => { },
  onUpdateRunStatus = () => { },
  onDeleteRun = () => { },
  selectedRunId = null,
}) {
  return (
    <div>
      <h5 className="mb-2">Runs</h5>
      <Table striped bordered hover size="sm" responsive>
        <thead>
          <tr>
            <th />            
            <th>Status</th>
            <th>ID</th>
            <th>Exit Flag</th>
            <th>User</th>
            <th>Started</th>
            <th>Ended</th>
            <th>Duration</th>
            <th />            
          </tr>
        </thead>
        <tbody>
          {runs.length === 0 ? (
            <tr>
              <td colSpan={8} className="text-center text-muted">
                No runs available
              </td>
            </tr>
          ) : (
            runs.map((run) => (
              <tr
                key={run.id}
                style={{
                  backgroundColor:
                    run.id === selectedRunId ? "#e9f2ff" : undefined,
                  fontWeight:
                    run.id === selectedRunId ? "600" : "normal",
                }}
              >
                <td>
                  <Button
                    size="sm"
                    variant={run.id === selectedRunId ? "primary" : "outline-primary"}
                    title="Select run"
                    onClick={() => onSelectRun(run.id)}
                  >
                    <i className="bi-arrow-right-circle" />
                  </Button>
                </td>                
                <td>
                  <RunStatus
                    runId={run.id}
                    status={run.status}
                    onUpdate={onUpdateRunStatus}
                  />
                </td>
                <td>{run.id}</td>
                <td>{run.exitflag}</td>
                <td>{run.user_first_name} {run.user_last_name}</td>
                <td>{formatDateTime(run.time)}</td>
                <td>{formatDateTime(run.endtime)}</td>
                <td>{calculateDuration(run.time, run.endtime)}</td>
                <td>
                  <Button
                    size="sm"
                    variant="outline-danger"
                    title="Delete run"
                    onClick={() => onDeleteRun(run.id)}
                  >
                    <i className="bi bi-trash" />
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </div>
  );
}