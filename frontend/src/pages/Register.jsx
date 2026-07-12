import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import apiClient from "../utils/api";

export default function Register() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  // Controlled form state parameters
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    fullName: "",
    password: "",
  });

  const [avatar, setAvatar] = useState(null);
  const [coverImage, setCoverImage] = useState(null);

  // Handle textual input field state mutations smoothly
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // React Query Mutation: Handles asynchronous submission pipelines cleanly
  const mutation = useMutation({
    mutationFn: async (userData) => {
      const response = await apiClient.post("/users/register", userData, {
        headers: { "Content-Type": "multipart/form-data" }, // Required for multipart file transfers
      });
      return response.data;
    },
    onSuccess: () => {
      // Redirect straight to login once user account is successfully registered
      navigate("/login");
    },
    onError: (err) => {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    // Validate that required avatar image asset is loaded before dispatching payload
    if (!avatar) {
      setError("Avatar image is required");
      return;
    }

    // Pack data into standard FormData object to handle binary file transmission
    const data = new FormData();
    data.append("username", formData.username.toLowerCase());
    data.append("email", formData.email);
    data.append("fullName", formData.fullName);
    data.append("password", formData.password);
    data.append("avatar", avatar);
    if (coverImage) {
      data.append("coverImage", coverImage);
    }

    mutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f] px-4 py-12">
      <div className="max-w-md w-full bg-[#1f1f1f] border border-[#3f3f3f] rounded-xl p-8 shadow-2xl">
        <h2 className="text-3xl font-extrabold text-center text-white mb-2">Create Account</h2>
        <p className="text-sm text-center text-gray-400 mb-8">
          Join the streaming network platform today
        </p>

        {error && (
          <div className="bg-red-900/40 border border-red-500 text-red-200 text-sm p-3 rounded-lg mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Full Name</label>
            <input
              type="text"
              name="fullName"
              required
              value={formData.fullName}
              onChange={handleInputChange}
              className="w-full bg-[#0f0f0f] border border-[#3f3f3f] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-500 transition-colors"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Username</label>
            <input
              type="text"
              name="username"
              required
              value={formData.username}
              onChange={handleInputChange}
              className="w-full bg-[#0f0f0f] border border-[#3f3f3f] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-500 transition-colors"
              placeholder="johndoe"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Email Address</label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleInputChange}
              className="w-full bg-[#0f0f0f] border border-[#3f3f3f] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-500 transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Password</label>
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleInputChange}
              className="w-full bg-[#0f0f0f] border border-[#3f3f3f] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-500 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Avatar *</label>
              <input
                type="file"
                accept="image/*"
                required
                onChange={(e) => setAvatar(e.target.files[0])}
                className="w-full text-xs text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-red-600 file:text-white hover:file:bg-red-700 file:cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Cover Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setCoverImage(e.target.files[0])}
                className="w-full text-xs text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#3f3f3f] file:text-white hover:file:bg-[#4f4f4f] file:cursor-pointer"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg mt-4 cursor-pointer focus:outline-none disabled:bg-red-800 transition-colors"
          >
            {mutation.isPending ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-red-500 hover:underline font-semibold">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}