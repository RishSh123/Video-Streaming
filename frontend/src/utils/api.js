import axios from "axios";

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1",
    withCredentials: true, // Crucial: Automatically attaches HTTP-Only Refresh/Access JWT cookies to every single request
    timeout: 10000 // Abort requests taking longer than 10 seconds to safeguard UI performance
});

export default apiClient;