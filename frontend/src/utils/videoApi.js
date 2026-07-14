import apiClient from "./api";

// Fetch all public videos for the global home feed grid
export const fetchHomeVideos = async () => {
  const response = await apiClient.get("/videos");
  // Assumes your standard backend response envelop structure returns data inside a wrapper
  return response.data.data; 
};

// Fetch channel profile data by unique username handler string
export const fetchChannelProfile = async (username) => {
  const response = await apiClient.get(`/users/c/${username}`);
  return response.data.data;
};

// Fetch all videos published exclusively by a specific channel
export const fetchChannelVideos = async (username) => {
  const response = await apiClient.get(`/videos/c/${username}`);
  return response.data.data;
};