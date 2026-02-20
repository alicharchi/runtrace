import { useState } from "react";
import {
  Badge,
  Form,
  Button,
  Stack,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";

const statusMap = {
  1: { text: "Running", variant: "primary" },
  2: { text: "Completed", variant: "success" },
  3: { text: "Failed", variant: "danger" },
};

export default function RunStatus({ runId, status, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [newStatus, setNewStatus] = useState(status);

  const mapped = statusMap[status];

  const handleUpdate = () => {
    if (newStatus !== status) {
      onUpdate(runId, newStatus);
    }
    setEditing(false);
  };

  if (!editing) {
    if (!mapped) {
      return (
        <OverlayTrigger
          placement="top"
          overlay={
            <Tooltip id={`tooltip-unknown-${status}`}>
              Raw status: {status}
            </Tooltip>
          }
        >
          <Badge
            bg="secondary"
            style={{ cursor: "pointer" }}
            onClick={() => setEditing(true)}
          >
            Unknown
          </Badge>
        </OverlayTrigger>
      );
    }

    return (
      <Badge
        bg={mapped.variant}
        style={{ cursor: "pointer" }}
        onClick={() => setEditing(true)}
      >
        {mapped.text}
      </Badge>
    );
  }

  return (
    <Stack direction="horizontal" gap={2}>
      <Form.Select
        size="sm"
        value={newStatus}
        onChange={(e) => setNewStatus(Number(e.target.value))}
      >
        {Object.entries(statusMap).map(([value, s]) => (
          <option key={value} value={value}>
            {s.text}
          </option>
        ))}
      </Form.Select>

      <Button size="sm" variant="success" onClick={handleUpdate}>
        Update
      </Button>

      <Button
        size="sm"
        variant="outline-secondary"
        onClick={() => {
          setNewStatus(status);
          setEditing(false);
        }}
      >
        Cancel
      </Button>
    </Stack>
  );
}