import api, { API_URL } from "./axios.js";

export const getCurrentUser = () => api.get("/auth/me").then((r) => r.data.data);

export const logout = () => api.post("/auth/logout").then((r) => r.data.data);

// Full page redirect to kick off the Google OAuth flow
export const loginWithGoogle = () => {
  window.location.href = `${API_URL}/auth/google`;
};
