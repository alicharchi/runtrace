import { Table, Button } from "react-bootstrap";

export default function RunsTable({ runs, onSelectRun }) {
  return (
    <div>
      <h5>Runs</h5>
      <Table striped bordered hover size="sm" responsive>
        <thead>
          <tr>
            <th>ID</th>
            <th>Time</th>
            <th>Status</th>
            <th>Exit Flag</th>
            <th>End Time</th>
            <th>User ID</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((run) => (
            <tr key={run.id}>
              <td>{run.id}</td>
              <td>{run.time}</td>
              <td>{run.status}</td>
              <td>{run.exitflag}</td>
              <td>{run.endTime}</td>
              <td>{run.user_id}</td>
              <td>
                <Button
                  size="sm"
                  variant="primary"
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
