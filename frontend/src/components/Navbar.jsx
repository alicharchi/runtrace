import { Navbar, Nav, Container, Button } from "react-bootstrap";
import { NavLink, useNavigate } from "react-router-dom";

export default function AppNavbar({ email, token, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    if (onLogout) onLogout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="shadow-sm">
      {/* Top row: App title + email/logout */}
      <Navbar bg="light" expand="lg">
        <Container fluid>
          <Navbar.Brand className="fw-bold">RunTrace</Navbar.Brand>
          {token && (
            <div className="d-flex align-items-center gap-2 ms-auto">
              {email && <span className="fw-bold">{email}</span>}
              <Button variant="link" className="p-0" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          )}
        </Container>
      </Navbar>

      {/* Bottom row: Navigation bar full width */}
      <Navbar bg="light" expand="lg">
        <Container fluid>
          <Nav className="me-auto w-100">
            <Nav.Link as={NavLink} to="/dashboard/runs">
              Runs
            </Nav.Link>
          </Nav>
        </Container>
      </Navbar>
    </div>
  );
}
