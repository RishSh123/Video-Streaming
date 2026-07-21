import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// 1. CREATE A NEW PLAYLIST
// 1. CREATE A NEW PLAYLIST
const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    if (!name || name.trim() === "") {
        throw new ApiError(400, "Playlist title name is required");
    }

    // ◄── ADD THIS GATE: Stop requests from tools like Postman that bypass the UI
    if (name.trim().toLowerCase() === "watch later") {
        throw new ApiError(400, "The collection name 'Watch Later' is a restricted system layout keyword");
    }

    const playlist = await Playlist.create({
        name,
        description: description || "",
        videos: [],
        owner: req.user?._id
    });

    return res
        .status(201)
        .json(new ApiResponse(201, playlist, "Playlist collection created successfully"));
});

// 2. FETCH A USER'S TOTAL PLAYLISTS
// 2. FETCH A USER'S TOTAL PLAYLISTS
const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user identifier format");
    }

    // Exclude system playlist "Watch Later" from general user playlist queries
    const playlists = await Playlist.find({ 
        owner: userId,
        name: { $ne: "Watch Later" }
    }).populate("videos", "title thumbnailUrl views duration");

    return res
        .status(200)
        .json(new ApiResponse(200, playlists, "User playlists index fetched successfully"));
});

// 3. FETCH A SPECIFIC PLAYLIST BY ID
const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist identifier format");
    }

    const playlist = await Playlist.findById(playlistId)
        .populate({
            path: "videos",
            match: { isPublished: true }, // Filter out unpublished videos
            select: "title description thumbnailUrl videoUrl views duration owner",
            populate: {
                path: "owner",
                select: "username fullName avatar"
            }
        })
        .populate("owner", "username fullName avatar");

    if (!playlist) {
        throw new ApiError(404, "Playlist record not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Playlist data compiled successfully"));
});

// 4. ADD A VIDEO TO A PLAYLIST
const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid format inside routing id references");
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) throw new ApiError(404, "Playlist record not found");

    const video = await Video.findById(videoId);
    if (!video || !video.isPublished) throw new ApiError(404, "Target video track not found");

    // Security Gate: Check Ownership
    if (playlist.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You lack structural authorization to modify this collection");
    }

    // Check if video already exists inside the playlist array
    if (playlist.videos.includes(videoId)) {
        return res
            .status(400)
            .json(new ApiResponse(400, playlist, "Video asset already exists within this playlist"));
    }

    playlist.videos.push(videoId);
    await playlist.save();

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Video tracking added to playlist successfully"));
});

// 5. REMOVE A VIDEO FROM A PLAYLIST
const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid format inside routing id references");
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) throw new ApiError(404, "Playlist record not found");

    // Security Gate: Check Ownership
    if (playlist.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You lack structural authorization to modify this collection");
    }

    // Pull item directly using Mongoose Array updates
    playlist.videos.pull(videoId);
    await playlist.save();

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Video trace pulled from playlist successfully"));
});

// 6. UPDATE PLAYLIST DETAILS
const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { name, description } = req.body;

    if (!name || name.trim() === "") {
        throw new ApiError(400, "Playlist title name cannot be blank");
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) throw new ApiError(404, "Playlist record not found");

    // Security Gate: Check Ownership
    if (playlist.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You lack structural authorization to modify this collection");
    }

    playlist.name = name;
    playlist.description = description || "";
    await playlist.save();

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Playlist header information updated successfully"));
});

// 7. DELETE AN ENTIRE PLAYLIST
const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist identifier format");
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) throw new ApiError(404, "Playlist record not found");

    // Security Gate: Check Ownership
    if (playlist.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You lack structural authorization to purge this collection");
    }

    await Playlist.findByIdAndDelete(playlistId);

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Playlist collection purged from record completely"));
});

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    updatePlaylist,
    deletePlaylist
};