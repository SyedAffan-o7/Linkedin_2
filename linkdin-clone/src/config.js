// API Configuration
// Backend deployed on Render.com
//

const isProduction = import.meta.env.PROD;

export const API_BASE_URL = isProduction 
  ? 'https://linkedin-clone-backend-9472.onrender.com'  // Your deployed Render URL
  : 'http://localhost:5000';

export const API_URL = `${API_BASE_URL}/api`;

// Helper to get full media URL
export const getMediaUrl = (path) => {
  if (!path) return null;
  return path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
};
