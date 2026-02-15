import { Navbar, Nav, Container, Button } from "react-bootstrap";
import { NavLink, useNavigate } from "react-router-dom";

export default function AppNavbar({ fullName, token, isSuperUser, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    if (onLogout) onLogout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="shadow-sm">
      {/* Top row: App title + view profile/logout */}
      <Navbar bg="light" expand="lg">
        <Container fluid>
          <Navbar.Brand className="fw-bold">RunTrace</Navbar.Brand>

          {token && (
            <div className="d-flex align-items-center gap-2 ms-auto">

              <Button as={NavLink} to="/dashboard/profile" variant="link" className="p-0" >
                {fullName}
              </Button>

              <Button variant="link" className="p-0" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          )}
        </Container>
      </Navbar>

      {/* Bottom row: Navigation links */}
      <Navbar bg="light" expand="lg">
        <Container fluid>
          <Nav className="me-auto w-100">
            <Nav.Link
              as={NavLink}
              to="/dashboard/runs"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              Runs
            </Nav.Link>

            {isSuperUser && (
              <Nav.Link
                as={NavLink}
                to="/dashboard/users"
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                Users
              </Nav.Link>
            )}
          </Nav>
        </Container>
      </Navbar>
    </div>
  );
}
