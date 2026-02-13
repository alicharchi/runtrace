import { Badge, OverlayTrigger, Tooltip } from "react-bootstrap";

export default function UserType({ type: userType }) {
  const statusMap = {
    true: { text: "Yes", variant: "primary" },
    false: { text: "No", variant: "secondary" },    
  };

  const mapped = statusMap[!!userType];
    
  if (!mapped) {
    return (
      <OverlayTrigger
        placement="top"
        overlay={<Tooltip id={`tooltip-unknown-${userType}`}>User type: {userType}</Tooltip>}
      >
        <Badge bg="warning">Unknown</Badge>
      </OverlayTrigger>
    );
  }

  return <Badge bg={mapped.variant}>{mapped.text}</Badge>;
}
