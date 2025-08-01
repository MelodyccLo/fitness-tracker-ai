// frontend/src/components/auth/Register.tsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api"; // Ensure this path is correct

const Register: React.FC = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [fitnessLevel, setFitnessLevel] = useState("Beginner"); // Default to Beginner

  // Error states for individual fields
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<
    string | null
  >(null);
  const [ageError, setAgeError] = useState<string | null>(null);
  const [heightError, setHeightError] = useState<string | null>(null);
  const [weightError, setWeightError] = useState<string | null>(null);
  const [fitnessLevelError, setFitnessLevelError] = useState<string | null>(
    null
  ); // NEW: For fitness level

  const [generalError, setGeneralError] = useState<string | null>(null); // For backend or general errors

  const navigate = useNavigate();

  // --- Validation Functions ---
  const validateUsername = (value: string) => {
    if (!value.trim()) return "Username is required.";
    if (value.length < 3) return "Username must be at least 3 characters.";
    return null;
  };

  const validateEmail = (value: string) => {
    if (!value.trim()) return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
      return "Invalid email format.";
    return null;
  };

  const validatePassword = (value: string) => {
    if (!value) return "Password is required.";
    if (value.length < 6) return "Password must be at least 6 characters.";
    return null;
  };

  const validateConfirmPassword = (value: string, pass: string) => {
    if (!value) return "Confirm password is required.";
    if (value !== pass) return "Passwords do not match.";
    return null;
  };

  const validateAge = (value: string) => {
    if (!value.trim()) return "Age is required."; // Made mandatory
    const num = parseInt(value);
    if (isNaN(num) || num < 1 || num > 120)
      return "Age must be between 1 and 120.";
    return null;
  };

  const validateHeight = (value: string) => {
    if (!value.trim()) return "Height is required."; // Made mandatory
    const num = parseFloat(value); // Keep parseFloat for potentially decimal cm values
    if (isNaN(num) || num < 50 || num > 250)
      return "Height must be between 50 and 250 cm.";
    return null;
  };

  const validateWeight = (value: string) => {
    if (!value.trim()) return "Weight is required."; // Made mandatory
    const num = parseFloat(value);
    if (isNaN(num) || num < 10 || num > 600)
      return "Weight must be between 10 and 600 kg.";
    return null;
  };

  const validateFitnessLevel = (value: string) => {
    if (!value || value === "Select Fitness Level")
      return "Fitness Level is required."; // Ensure not default option
    return null;
  };

  // --- Handlers for Input Changes and Blurs ---
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsername(value);
    setUsernameError(validateUsername(value));
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    setEmailError(validateEmail(value));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    setPasswordError(validatePassword(value));
    setConfirmPasswordError(validateConfirmPassword(confirmPassword, value)); // Re-validate confirm password
  };

  const handleConfirmPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setConfirmPassword(value);
    setConfirmPasswordError(validateConfirmPassword(value, password));
  };

  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAge(value);
    setAgeError(validateAge(value));
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setHeight(value);
    setHeightError(validateHeight(value));
  };

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setWeight(value);
    setWeightError(validateWeight(value));
  };

  const handleFitnessLevelChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const value = e.target.value;
    setFitnessLevel(value);
    setFitnessLevelError(validateFitnessLevel(value));
  };

  // --- Form Submission ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    // Re-validate all fields on submit to catch any un-blurred errors
    const usernameErr = validateUsername(username);
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    const confirmPasswordErr = validateConfirmPassword(
      confirmPassword,
      password
    );
    const ageErr = validateAge(age);
    const heightErr = validateHeight(height);
    const weightErr = validateWeight(weight);
    const fitnessLevelErr = validateFitnessLevel(fitnessLevel); // NEW: Validate fitness level

    setUsernameError(usernameErr);
    setEmailError(emailErr);
    setPasswordError(passwordErr);
    setConfirmPasswordError(confirmPasswordErr);
    setAgeError(ageErr);
    setHeightError(heightErr);
    setWeightError(weightErr);
    setFitnessLevelError(fitnessLevelErr); // NEW: Set fitness level error

    // Check if any error exists or if mandatory fields are empty
    if (
      usernameErr ||
      emailErr ||
      passwordErr ||
      confirmPasswordErr ||
      ageErr ||
      heightErr ||
      weightErr ||
      fitnessLevelErr ||
      !username.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword ||
      !age.trim() ||
      !height.trim() ||
      !weight.trim() ||
      !fitnessLevel
    ) {
      // Added mandatory checks
      setGeneralError(
        "Please correct the errors in the form and fill all required fields."
      );
      return;
    }

    try {
      await api.post("/auth/register", {
        username,
        email,
        password,
        age: parseInt(age), // Always parse as it's now mandatory
        height: parseInt(height), // Always parse as it's now mandatory
        weight: parseFloat(weight), // Always parse as it's now mandatory
        fitnessLevel,
      });
      alert("Registration successful! Please log in.");
      navigate("/login");
    } catch (err: any) {
      console.error("Registration failed:", err);
      setGeneralError(
        err.response?.data?.message || "Registration failed. Please try again."
      );
    }
  };

  // Determine if the Register button should be disabled
  const isFormInvalid = Boolean(
    usernameError ||
      emailError ||
      passwordError ||
      confirmPasswordError ||
      ageError ||
      heightError ||
      weightError ||
      fitnessLevelError ||
      !username.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword ||
      !age.trim() ||
      !height.trim() ||
      !weight.trim() ||
      !fitnessLevel // Added mandatory checks
  );

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-7">
          <div className="card">
            <div
              className="card-header text-center text-white"
              style={{ backgroundColor: "var(--primary-color)" }}
            >
              {" "}
              {/* Themed header */}
              <h2>Join Now!</h2> {/* More engaging title */}
            </div>
            <div className="card-body p-4">
              {generalError && (
                <div className="alert alert-danger">{generalError}</div>
              )}
              <form onSubmit={handleSubmit}>
                {/* --- Account Information --- */}
                <h5 className="mb-3 section-title">Account Details</h5>{" "}
                {/* Themed section title */}
                <div className="mb-3">
                  <label htmlFor="username" className="form-label">
                    Username <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control ${
                      usernameError ? "is-invalid" : ""
                    }`}
                    id="username"
                    value={username}
                    onChange={handleUsernameChange}
                    onBlur={handleUsernameChange}
                    required
                  />
                  {usernameError && (
                    <div className="invalid-feedback">{usernameError}</div>
                  )}
                </div>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    Email address <span className="text-danger">*</span>
                  </label>
                  <input
                    type="email"
                    className={`form-control ${emailError ? "is-invalid" : ""}`}
                    id="email"
                    value={email}
                    onChange={handleEmailChange}
                    onBlur={handleEmailChange}
                    required
                  />
                  {emailError && (
                    <div className="invalid-feedback">{emailError}</div>
                  )}
                </div>
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">
                    Password <span className="text-danger">*</span>
                  </label>
                  <input
                    type="password"
                    className={`form-control ${
                      passwordError ? "is-invalid" : ""
                    }`}
                    id="password"
                    value={password}
                    onChange={handlePasswordChange}
                    onBlur={handlePasswordChange}
                    required
                  />
                  {passwordError && (
                    <div className="invalid-feedback">{passwordError}</div>
                  )}
                </div>
                <div className="mb-4">
                  <label htmlFor="confirmPassword" className="form-label">
                    Confirm Password <span className="text-danger">*</span>
                  </label>
                  <input
                    type="password"
                    className={`form-control ${
                      confirmPasswordError ? "is-invalid" : ""
                    }`}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    onBlur={handleConfirmPasswordChange}
                    required
                  />
                  {confirmPasswordError && (
                    <div className="invalid-feedback">
                      {confirmPasswordError}
                    </div>
                  )}
                </div>
                {/* --- Personal Information (Now Mandatory) --- */}
                <h5 className="mb-3 section-title mt-4 pt-2 border-top">
                  Personal Information
                </h5>
                <div className="mb-3">
                  <label htmlFor="age" className="form-label">
                    Age <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    className={`form-control ${ageError ? "is-invalid" : ""}`}
                    id="age"
                    value={age}
                    onChange={handleAgeChange}
                    onBlur={handleAgeChange}
                    min="1"
                    max="120"
                    required // Made mandatory
                  />
                  {ageError && (
                    <div className="invalid-feedback">{ageError}</div>
                  )}
                </div>
                <div className="mb-3">
                  <label htmlFor="height" className="form-label">
                    Height (cm) <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    className={`form-control ${
                      heightError ? "is-invalid" : ""
                    }`}
                    id="height"
                    value={height}
                    onChange={handleHeightChange}
                    onBlur={handleHeightChange}
                    min="50"
                    max="250"
                    required // Made mandatory
                  />
                  {heightError && (
                    <div className="invalid-feedback">{heightError}</div>
                  )}
                </div>
                <div className="mb-3">
                  <label htmlFor="weight" className="form-label">
                    Weight (kg) <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    className={`form-control ${
                      weightError ? "is-invalid" : ""
                    }`}
                    id="weight"
                    value={weight}
                    onChange={handleWeightChange}
                    onBlur={handleWeightChange}
                    step="0.1"
                    min="10"
                    max="600"
                    required // Made mandatory
                  />
                  {weightError && (
                    <div className="invalid-feedback">{weightError}</div>
                  )}
                </div>
                <div className="mb-4">
                  <label htmlFor="fitnessLevel" className="form-label">
                    Fitness Level <span className="text-danger">*</span>
                  </label>
                  <select
                    className={`form-select ${
                      fitnessLevelError ? "is-invalid" : ""
                    }`}
                    id="fitnessLevel"
                    value={fitnessLevel}
                    onChange={handleFitnessLevelChange}
                    onBlur={handleFitnessLevelChange}
                    required // Made mandatory
                  >
                    <option value="">-- Select Your Fitness Level --</option>{" "}
                    {/* Added a placeholder option */}
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                  {fitnessLevelError && (
                    <div className="invalid-feedback">{fitnessLevelError}</div>
                  )}
                </div>
                <div className="d-grid gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    disabled={isFormInvalid}
                  >
                    Register
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
