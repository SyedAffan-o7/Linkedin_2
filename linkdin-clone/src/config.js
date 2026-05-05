// API Configuration
// In production, this should be your deployed backend URL
// For Render.com: https://linkedin-clone-backend.onrender.com/api

const isProduction = import.meta.env.PROD;

export const API_BASE_URL = isProduction 
  ? 'https://linkedin-clone-backend.onrender.com'  // Update this after deploying to Render
  : 'http://localhost:5000';

export const API_URL = `${API_BASE_URL}/api`;

// Helper to get full media URL
export const getMediaUrl = (path) => {
  if (!path) return null;
  return path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
};
