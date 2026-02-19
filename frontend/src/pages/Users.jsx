import React, { useState, useEffect, useMemo } from "react";
import { fetchUsers, addUser, deleteUser, updateUser } from "../api";
import UserType from "../components/UserType";
import { Button, Form, Modal, Spinner } from "react-bootstrap";

export default function Users({ token }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [editingUserId, setEditingUserId] = useState(null);

  const [userForm, setUserForm] = useState({
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
      return fullName.includes(filterText.toLowerCase()) || userEmail.includes(filterText.toLowerCase());
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

  // --- Modal form change ---
  const handleModalChange = (e) => {
    const { name, value, type, checked } = e.target;
    setUserForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  // --- Add or Update User ---
  const handleModalSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError("");

    // Validation
    if (!userForm.first_name || !userForm.last_name || !userForm.email || (modalMode === "add" && !userForm.password)) {
      setModalError("All required fields must be filled");
      setModalLoading(false);
      return;
    }

    try {
      if (modalMode === "add") {
        if (data.some((u) => u.email.toLowerCase() === userForm.email.toLowerCase())) {
          setModalError("Email already registered");
          setModalLoading(false);
          return;
        }
        const payload = { ...userForm, is_superuser: userForm.is_superuser ? 1 : 0 };
        const addedUser = await addUser(payload, token);
        setData((prev) => [...prev, addedUser]);
      } else if (modalMode === "edit") {
        const updatePayload = { ...userForm };
        if (!updatePayload.password) delete updatePayload.password;
        updatePayload.is_superuser = updatePayload.is_superuser ? 1 : 0;
        const updatedUser = await updateUser(editingUserId, updatePayload, token);
        setData((prev) => prev.map((u) => (u.id === editingUserId ? updatedUser : u)));
      }

      setShowModal(false);
      setUserForm({ first_name: "", last_name: "", email: "", password: "", is_superuser: false });
      setEditingUserId(null);
    } catch (err) {
      setModalError(err.message);
    } finally {
      setModalLoading(false);
    }
  };

  // --- Delete User ---
  const handleDeleteUser = async (userId, fullName) => {
    if (!window.confirm(`Are you sure you want to delete "${fullName}"?`)) return;
    try {
      await deleteUser(userId, token);
      setData((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      alert(`Failed to delete user: ${err.message}`);
    }
  };

  // --- Open modal ---
  const openAddModal = () => {
    setModalMode("add");
    setUserForm({ first_name: "", last_name: "", email: "", password: "", is_superuser: false });
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setModalMode("edit");
    setEditingUserId(user.id);
    setUserForm({ ...user, password: "" }); 
    setShowModal(true);
  };

  if (!token) return <p>Please login to see user data.</p>;
  if (loading) return <p>Loading data...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      {/* Top controls */}
      <div className="d-flex justify-content-between mb-3">
        <Button onClick={openAddModal}>Add User</Button>
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
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((user) => (
            <tr key={user.id}>
              <td>{user.first_name} {user.last_name}</td>
              <td>{user.email}</td>
              <td><UserType type={user.is_superuser} /></td>
              <td>
                <Button variant="outline-secondary" size="sm" onClick={() => openEditModal(user)}>Edit</Button>{" "}
                <Button variant="outline-danger" size="sm" onClick={() => handleDeleteUser(user.id, `${user.first_name} ${user.last_name}`)}>Delete</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Form onSubmit={handleModalSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>{modalMode === "add" ? "Add New User" : "Edit User"}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {modalError && <p className="text-danger">{modalError}</p>}
            <Form.Group className="mb-2">
              <Form.Label>First Name</Form.Label>
              <Form.Control name="first_name" value={userForm.first_name} onChange={handleModalChange} required />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Last Name</Form.Label>
              <Form.Control name="last_name" value={userForm.last_name} onChange={handleModalChange} required />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Email</Form.Label>
              <Form.Control name="email" type="email" value={userForm.email} onChange={handleModalChange} required />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Password {modalMode === "edit" && "(leave blank to keep current)"}</Form.Label>
              <Form.Control name="password" type="password" value={userForm.password} onChange={handleModalChange} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Check type="checkbox" label="Superuser" name="is_superuser" checked={userForm.is_superuser} onChange={handleModalChange} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={modalLoading}>
              {modalLoading ? <Spinner animation="border" size="sm" /> : modalMode === "add" ? "Add User" : "Save Changes"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}
