import { Badge, OverlayTrigger, Tooltip } from "react-bootstrap";

export default function RunStatus({ status }) {
  const statusMap = {
    1: { text: "Running", variant: "primary" },
    2: { text: "Completed", variant: "success" },
    3: { text: "Failed", variant: "danger" },    
  };

  const mapped = statusMap[status];
    
  if (!mapped) {
    return (
      <OverlayTrigger
        placement="top"
        overlay={<Tooltip id={`tooltip-unknown-${status}`}>Raw status: {status}</Tooltip>}
      >
        <Badge bg="secondary">Unknown</Badge>
      </OverlayTrigger>
    );
  }

  return <Badge bg={mapped.variant}>{mapped.text}</Badge>;
}
