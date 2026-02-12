import React, { useState, useEffect, useMemo } from "react";
import { fetchUsers, addUser } from "../api";
import UserType from "./UserType";
import { Button, Form, Modal, Spinner } from "react-bootstrap";

export default function Users({ token }) {
  // --- Hooks at top ---
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    is_superuser: false,
  });
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  const [filterText, setFilterText] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // --- Fetch users ---
  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      try {
        const users = await fetchUsers(token);
        setData(users);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  // --- Filtering & Sorting ---
  const filteredData = useMemo(() => {
    let filtered = data.filter((user) => {
      const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
      const userEmail = user.email.toLowerCase();
      return (
        fullName.includes(filterText.toLowerCase()) ||
        userEmail.includes(filterText.toLowerCase())
      );
    });

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (typeof aValue === "boolean") aValue = aValue ? 1 : 0;
        if (typeof bValue === "boolean") bValue = bValue ? 1 : 0;

        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [data, filterText, sortConfig]);

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
    setSortConfig({ key, direction });
  };

  // --- Add User Handlers ---
  const handleModalChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewUser((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError("");

    if (data.some((u) => u.email.toLowerCase() === newUser.email.toLowerCase())) {
      setModalError("Email is already registered");
      setModalLoading(false);
      return;
    }

    try {
      // send is_superuser as number
      const payload = { ...newUser, is_superuser: newUser.is_superuser ? 1 : 0 };
      const addedUser = await addUser(payload, token);
      setData((prev) => [...prev, addedUser]);
      setShowModal(false);
      setNewUser({ first_name: "", last_name: "", email: "", password: "", is_superuser: false });
    } catch (err) {
      setModalError(err.message);
    } finally {
      setModalLoading(false);
    }
  };

  // --- Early render messages ---
  if (!token) return <p>Please login to see user data.</p>;
  if (loading) return <p>Loading data...</p>;
  if (error) return <p>Error: {error.message}</p>;

  // --- Render ---
  return (
    <div>
      {/* Top controls */}
      <div className="d-flex justify-content-between mb-3">
        <Button onClick={() => setShowModal(true)}>Add User</Button>
        <Form.Control
          type="text"
          placeholder="Filter by name or email..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          style={{ width: "250px" }}
        />
      </div>

      {/* Users table */}
      <table className="table table-striped">
        <thead>
          <tr>
            <th style={{ cursor: "pointer" }} onClick={() => requestSort("first_name")}>
              Name {sortConfig.key === "first_name" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
            </th>
            <th style={{ cursor: "pointer" }} onClick={() => requestSort("email")}>
              Email {sortConfig.key === "email" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
            </th>
            <th style={{ cursor: "pointer" }} onClick={() => requestSort("is_superuser")}>
              Superuser {sortConfig.key === "is_superuser" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((item) => (
            <tr key={item.id}>
              <td>{item.first_name} {item.last_name}</td>
              <td>{item.email}</td>
              <td><UserType type={item.is_superuser} /></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Add User Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Form onSubmit={handleAddUser}>
          <Modal.Header closeButton>
            <Modal.Title>Add New User</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {modalError && <p className="text-danger">{modalError}</p>}
            <Form.Group className="mb-2">
              <Form.Label>First Name</Form.Label>
              <Form.Control name="first_name" value={newUser.first_name} onChange={handleModalChange} required />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Last Name</Form.Label>
              <Form.Control name="last_name" value={newUser.last_name} onChange={handleModalChange} required />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Email</Form.Label>
              <Form.Control name="email" type="email" value={newUser.email} onChange={handleModalChange} required />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Password</Form.Label>
              <Form.Control name="password" type="password" value={newUser.password} onChange={handleModalChange} required />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Check
                type="checkbox"
                label="Superuser"
                name="is_superuser"
                checked={newUser.is_superuser}
                onChange={handleModalChange}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={modalLoading}>
              {modalLoading ? <Spinner animation="border" size="sm" /> : "Add User"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}
