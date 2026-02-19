import { Table, Button } from "react-bootstrap";
import RunStatus from "./RunStatus";
import { formatDateTime, calculateDuration } from "../utils";

export default function RunsTable({
  runs = [],
  onSelectRun = () => { },
  selectedRunId = null,
}) {
  return (
    <div>
      <h5 className="mb-2">Runs</h5>
      <Table striped bordered hover size="sm" responsive>
        <thead>
          <tr>
            <th>ID</th>
            <th>Status</th>
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
              <td colSpan={5} className="text-center text-muted">
                No runs available
              </td>
            </tr>
          ) : (
            runs.map((run) => (
              <tr
                key={run.id}
                style={{
                  backgroundColor: run.id === selectedRunId ? "#e9f2ff" : undefined,
                  fontWeight: run.id === selectedRunId ? "600" : "normal",
                }}
              >
                <td>{run.id}</td>
                <td><RunStatus status={run.status} /></td>
                <td>{run.exitflag}</td>
                <td>{run.user_first_name} {run.user_last_name}</td>
                <td>{formatDateTime(run.time)}</td>
                <td>{formatDateTime(run.endtime)}</td>
                <td>{calculateDuration(run.time, run.endtime)}</td>
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
            ))
          )}
        </tbody>
      </Table>
    </div>
  );
}
