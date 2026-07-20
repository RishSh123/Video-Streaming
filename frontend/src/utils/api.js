import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1",
  withCredentials: true, // Crucial if your backend reads tokens from HTTP-only browser cookies
});

// Axios Request Interceptor: Automatically injects bearer tokens if using headers
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Axios Response Interceptor: Catches 401 unauthorized errors globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;
    
    // Check if the endpoint explicitly requires authentication before kicking the user out
    if (error.response?.status === 401 && !originalRequest.url.includes("/videos/v/")) {
      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
      window.location.href = "/login";
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;