interface JwtPayload {
  id?: string;    // Changed to 'id' based on your JWT payload 
  userId?: string; // Keep this as optional if you want to support other JWT structures in the future
  _id?: string;
  sub?: string;
  // Add other properties if your JWT payload contains them (e.g., username, email, roles)
  iat?: number; // Issued at time 
  exp?: number; // Expiration time 
}

export const getUserIdFromToken = (): string | null => {
  const token = localStorage.getItem('token'); // Get the JWT token from localStorage

  if (!token) {
    console.log("No token found in localStorage.");
    return null; // No token found
  }

  try {
    const payloadBase64 = token.split('.')[1]; // Get the payload part (second part)
    const decodedPayload = atob(payloadBase64); // Decode from Base64Url to plain JSON string
    const payload: JwtPayload = JSON.parse(decodedPayload); // Parse the JSON string

    // Check for expiration (optional but good practice) 
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      console.warn("JWT token expired.");
      localStorage.removeItem('token'); // Clear expired token
      return null;
    }

    // IMPORTANT: Changed to return payload.id as confirmed by your JWT payload 
    return payload.id || null;

  } catch (error) {
    console.error("Error decoding JWT token, clearing it:", error);
    localStorage.removeItem('token'); // Clear invalid token
    return null;
  }
};

// You might also want functions to check if a user is authenticated:
export const isAuthenticated = (): boolean => {
  const userId = getUserIdFromToken();
  return userId !== null;
};