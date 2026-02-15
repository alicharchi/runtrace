import { useEffect, useState } from "react";
import { Card, Form, Button, Alert, Spinner } from "react-bootstrap";
import { fetchCurrentUser, updateUser } from "../api";

export default function CurrentUserProfile({ token , setFullName }) {
  const [meData, setMeData] = useState(null);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!token) return;

    async function loadUser() {
      try {
        const data = await fetchCurrentUser(token);
        setMeData(data);
        setFormData({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          email: data.email || "",
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      if (!meData || !meData.id) throw new Error("User ID not available");

      await updateUser(meData.id, {
        first_name: formData.first_name,
        last_name: formData.last_name,
      }, token);

      setMeData((prev) => ({
        ...prev,
        first_name: formData.first_name,
        last_name: formData.last_name,
      }));

      const fullName = `${formData.first_name} ${formData.last_name}`;
      localStorage.setItem("fullName", fullName);

      if (setFullName) setFullName(fullName);

      setSuccess("Profile updated successfully.");
    } catch (err) {
      setError(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" />
      </div>
    );
  }

  if (!meData) return null;

  return (
    <Card className="mx-auto mt-5 shadow-sm" style={{ maxWidth: "500px" }}>
      <Card.Body>
        <Card.Title className="mb-4 text-center">My Profile</Card.Title>

        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        <Form onSubmit={handleSubmit}>

          <Form.Group className="mb-4">
            <Form.Label>Email</Form.Label>
            <Form.Control
              value={formData.email}
              disabled
              plaintext
              readOnly
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>First Name</Form.Label>
            <Form.Control
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              disabled={saving}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Last Name</Form.Label>
            <Form.Control
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              disabled={saving}
            />
          </Form.Group>

          <Button
            type="submit"
            variant="primary"
            className="w-100"
            disabled={saving}
          >
            {saving ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
}
