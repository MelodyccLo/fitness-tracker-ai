// frontend/src/components/ProfilePage.tsx

import React, { useEffect, useState } from "react";
import api from "../utils/api";
import { getUserIdFromToken } from "../utils/authUtils"; // To get the logged-in user's ID

interface UserProfile {
  _id: string;
  username: string;
  email: string;
  age?: number;
  height?: number;
  weight?: number;
  fitnessLevel?: string;
}

const ProfilePage: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for editing
  const [isEditing, setIsEditing] = useState(false);
  const [editAge, setEditAge] = useState<string>("");
  const [editHeight, setEditHeight] = useState<string>("");
  const [editWeight, setEditWeight] = useState<string>("");
  const [editFitnessLevel, setEditFitnessLevel] = useState<string>("");

  // Error states for editing fields
  const [editAgeError, setEditAgeError] = useState<string | null>(null);
  const [editHeightError, setEditHeightError] = useState<string | null>(null);
  const [editWeightError, setEditWeightError] = useState<string | null>(null);
  const [editFitnessLevelError, setEditFitnessLevelError] = useState<
    string | null
  >(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // --- Validation Functions (copied from Register.tsx, adjust as needed for optional/required here) ---
  const validateAge = (value: string) => {
    if (!value.trim()) return "Age is required.";
    const num = parseInt(value);
    if (isNaN(num) || num < 1 || num > 120)
      return "Age must be between 1 and 120.";
    return null;
  };

  const validateHeight = (value: string) => {
    if (!value.trim()) return "Height is required.";
    const num = parseFloat(value);
    if (isNaN(num) || num < 50 || num > 250)
      return "Height must be between 50 and 250 cm.";
    return null;
  };

  const validateWeight = (value: string) => {
    if (!value.trim()) return "Weight is required.";
    const num = parseFloat(value);
    if (isNaN(num) || num < 10 || num > 600)
      return "Weight must be between 10 and 600 kg.";
    return null;
  };

  const validateFitnessLevel = (value: string) => {
    if (!value || value === "") return "Fitness Level is required.";
    return null;
  };

  // --- Fetch Profile Data ---
  useEffect(() => {
    const fetchProfile = async () => {
      const userId = getUserIdFromToken();
      if (!userId) {
        setError("User not authenticated. Please log in to view profile.");
        setLoading(false);
        return;
      }
      try {
        const res = await api.get("/auth/profile");
        setUser(res.data);
        // Initialize edit states
        setEditAge(res.data.age ? String(res.data.age) : "");
        setEditHeight(res.data.height ? String(res.data.height) : "");
        setEditWeight(res.data.weight ? String(res.data.weight) : "");
        setEditFitnessLevel(res.data.fitnessLevel || "Beginner");
      } catch (err: any) {
        console.error("Failed to fetch user profile:", err);
        setError(err.response?.data?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // --- Handle Save Profile ---
  const handleSave = async () => {
    setSaveError(null);

    // Validate all editing fields
    const ageErr = validateAge(editAge);
    const heightErr = validateHeight(editHeight);
    const weightErr = validateWeight(editWeight);
    const fitnessLevelErr = validateFitnessLevel(editFitnessLevel);

    setEditAgeError(ageErr);
    setEditHeightError(heightErr);
    setEditWeightError(weightErr);
    setEditFitnessLevelError(fitnessLevelErr);

    if (ageErr || heightErr || weightErr || fitnessLevelErr) {
      setSaveError("Please correct the errors before saving.");
      return;
    }

    const userId = getUserIdFromToken();
    if (!userId) {
      setSaveError("User not authenticated. Cannot save profile.");
      return;
    }

    try {
      // Assuming a PUT route for profile update: /api/auth/profile
      const res = await api.put("/auth/profile", {
        age: editAge ? parseInt(editAge) : undefined,
        height: editHeight ? parseInt(editHeight) : undefined,
        weight: editWeight ? parseFloat(editWeight) : undefined,
        fitnessLevel: editFitnessLevel,
      });
      setUser(res.data); // Update user state with new data
      setIsEditing(false); // Exit editing mode
      alert("Profile updated successfully!");
    } catch (err: any) {
      console.error("Failed to update user profile:", err);
      setSaveError(
        err.response?.data?.message ||
          "Failed to save profile. Please try again."
      );
    }
  };

  if (loading)
    return (
      <div className="container mt-5">
        <p>Loading profile...</p>
      </div>
    );
  if (error)
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  if (!user)
    return (
      <div className="container mt-5">
        <p>No user data found.</p>
      </div>
    );

  return (
    <div className="container mt-5">
      <div className="card">
        <div
          className="card-header text-center text-white"
          style={{ backgroundColor: "var(--primary-color)" }}
        >
          {" "}
          {/* Themed header */}
          <h2>My Profile</h2>
        </div>
        <div className="card-body p-4">
          {saveError && <div className="alert alert-danger">{saveError}</div>}
          {isEditing ? (
            // Editing Mode
            <form>
              <h5 className="mb-3 section-title">Personal Information</h5>
              <div className="mb-3">
                <label htmlFor="editUsername" className="form-label">
                  Username
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="editUsername"
                  value={user.username} // Username is not editable for now
                  disabled
                />
              </div>
              <div className="mb-3">
                <label htmlFor="editEmail" className="form-label">
                  Email
                </label>
                <input
                  type="email"
                  className="form-control"
                  id="editEmail"
                  value={user.email} // Email is not editable for now
                  disabled
                />
              </div>
              <div className="mb-3">
                <label htmlFor="editAge" className="form-label">
                  Age <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  className={`form-control ${editAgeError ? "is-invalid" : ""}`}
                  id="editAge"
                  value={editAge}
                  onChange={(e) => {
                    setEditAge(e.target.value);
                    setEditAgeError(validateAge(e.target.value));
                  }}
                  onBlur={(e) => setEditAgeError(validateAge(e.target.value))}
                  min="1"
                  max="120"
                  required
                />
                {editAgeError && (
                  <div className="invalid-feedback">{editAgeError}</div>
                )}
              </div>
              <div className="mb-3">
                <label htmlFor="editHeight" className="form-label">
                  Height (cm) <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  className={`form-control ${
                    editHeightError ? "is-invalid" : ""
                  }`}
                  id="editHeight"
                  value={editHeight}
                  onChange={(e) => {
                    setEditHeight(e.target.value);
                    setEditHeightError(validateHeight(e.target.value));
                  }}
                  onBlur={(e) =>
                    setEditHeightError(validateHeight(e.target.value))
                  }
                  min="50"
                  max="250"
                  required
                />
                {editHeightError && (
                  <div className="invalid-feedback">{editHeightError}</div>
                )}
              </div>
              <div className="mb-3">
                <label htmlFor="editWeight" className="form-label">
                  Weight (kg) <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  className={`form-control ${
                    editWeightError ? "is-invalid" : ""
                  }`}
                  id="editWeight"
                  value={editWeight}
                  onChange={(e) => {
                    setEditWeight(e.target.value);
                    setEditWeightError(validateWeight(e.target.value));
                  }}
                  onBlur={(e) =>
                    setEditWeightError(validateWeight(e.target.value))
                  }
                  step="0.1"
                  min="10"
                  max="600"
                  required
                />
                {editWeightError && (
                  <div className="invalid-feedback">{editWeightError}</div>
                )}
              </div>
              <div className="mb-4">
                <label htmlFor="editFitnessLevel" className="form-label">
                  Fitness Level <span className="text-danger">*</span>
                </label>
                <select
                  className={`form-select ${
                    editFitnessLevelError ? "is-invalid" : ""
                  }`}
                  id="editFitnessLevel"
                  value={editFitnessLevel}
                  onChange={(e) => {
                    setEditFitnessLevel(e.target.value);
                    setEditFitnessLevelError(
                      validateFitnessLevel(e.target.value)
                    );
                  }}
                  onBlur={(e) =>
                    setEditFitnessLevelError(
                      validateFitnessLevel(e.target.value)
                    )
                  }
                  required
                >
                  <option value="">-- Select Your Fitness Level --</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
                {editFitnessLevelError && (
                  <div className="invalid-feedback">
                    {editFitnessLevelError}
                  </div>
                )}
              </div>

              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSave}
                  disabled={Boolean(
                    editAgeError ||
                      editHeightError ||
                      editWeightError ||
                      editFitnessLevelError ||
                      !editAge.trim() ||
                      !editHeight.trim() ||
                      !editWeight.trim() ||
                      !editFitnessLevel
                  )}
                >
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            // Viewing Mode
            <div>
              <h5 className="mb-3 section-title">Account Details</h5>
              <p className="card-text">
                <strong>Username:</strong> {user.username}
              </p>
              <p className="card-text">
                <strong>Email:</strong> {user.email}
              </p>

              <h5 className="mb-3 section-title mt-4 pt-2 border-top">
                Personal Information
              </h5>
              <p className="card-text">
                <strong>Age:</strong> {user.age || "N/A"}
              </p>
              <p className="card-text">
                <strong>Height:</strong>{" "}
                {user.height ? `${user.height} cm` : "N/A"}
              </p>
              <p className="card-text">
                <strong>Weight:</strong>{" "}
                {user.weight ? `${user.weight} kg` : "N/A"}
              </p>
              <p className="card-text">
                <strong>Fitness Level:</strong> {user.fitnessLevel || "N/A"}
              </p>

              <div className="d-flex justify-content-end mt-4">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
