import { useEffect, useState } from "react";
import { Card, Form, Button, Alert, Spinner, InputGroup } from "react-bootstrap";
import { fetchCurrentUser, updateUser } from "../api";

export default function CurrentUserProfile({ token, setFullName }) {
  const [meData, setMeData] = useState(null);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    old_password: "",
    new_password: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [changePassword, setChangePassword] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

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
          old_password: "",
          new_password: "",
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
      if (!meData?.id) throw new Error("User ID not available");

      if (changePassword) {
        if (!formData.old_password) {
          throw new Error("Current password is required");
        }
        if (!formData.new_password || formData.new_password.length < 8) {
          throw new Error("New password must be at least 8 characters");
        }
      }

      const updatePayload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
      };

      if (changePassword) {
        updatePayload.old_password = formData.old_password;
        updatePayload.new_password = formData.new_password;
      }

      await updateUser(meData.id, updatePayload, token);

      const fullName = `${formData.first_name} ${formData.last_name}`;
      localStorage.setItem("fullName", fullName);
      if (setFullName) setFullName(fullName);

      setFormData((prev) => ({
        ...prev,
        old_password: "",
        new_password: "",
      }));

      setChangePassword(false);
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
          {/* Email */}
          <Form.Group className="mb-4">
            <Form.Label>Email</Form.Label>
            <Form.Control plaintext readOnly value={formData.email} />
          </Form.Group>

          {/* First Name */}
          <Form.Group className="mb-3">
            <Form.Label>First Name</Form.Label>
            <Form.Control
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              disabled={saving}
            />
          </Form.Group>

          {/* Last Name */}
          <Form.Group className="mb-4">
            <Form.Label>Last Name</Form.Label>
            <Form.Control
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              disabled={saving}
            />
          </Form.Group>

          {/* Password Section */}
          <hr />
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="text-muted mb-0">Password</h6>
            <Button
              variant="outline-secondary"
              size="sm"
              disabled={saving}
              onClick={() => {
                setChangePassword((prev) => !prev);
                setFormData((prev) => ({
                  ...prev,
                  old_password: "",
                  new_password: "",
                }));
              }}
            >
              {changePassword ? "Cancel" : "Change Password"}
            </Button>
          </div>

          {changePassword && (
            <>
              {/* Old Password */}
              <Form.Group className="mb-3">
                <Form.Label>Current Password</Form.Label>
                <InputGroup>
                  <Form.Control
                    type={showOldPassword ? "text" : "password"}
                    name="old_password"
                    value={formData.old_password}
                    onChange={handleChange}
                    disabled={saving}
                    autoComplete="current-password"
                  />
                  <Button
                    variant="outline-secondary"
                    onClick={() => setShowOldPassword((v) => !v)}
                  >
                    {showOldPassword ? "Hide" : "Show"}
                  </Button>
                </InputGroup>
              </Form.Group>

              {/* New Password */}
              <Form.Group className="mb-4">
                <Form.Label>New Password</Form.Label>
                <InputGroup>
                  <Form.Control
                    type={showNewPassword ? "text" : "password"}
                    name="new_password"
                    value={formData.new_password}
                    onChange={handleChange}
                    disabled={saving}
                    autoComplete="new-password"
                  />
                  <Button
                    variant="outline-secondary"
                    onClick={() => setShowNewPassword((v) => !v)}
                  >
                    {showNewPassword ? "Hide" : "Show"}
                  </Button>
                </InputGroup>
                <Form.Text className="text-muted">
                  Minimum 8 characters
                </Form.Text>
              </Form.Group>
            </>
          )}

          {/* Submit */}
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
