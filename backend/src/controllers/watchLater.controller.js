import { Playlist } from "../models/playlist.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Helper function to dynamically locate or generate the system Watch Later playlist document
const getOrCreateWatchLaterPlaylist = async (userId) => {
    let playlist = await Playlist.findOne({
        owner: userId,
        name: "Watch Later"
    });

    if (!playlist) {
        playlist = await Playlist.create({
            name: "Watch Later",
            description: "",
            videos: [],
            owner: userId
        });
    }
    return playlist;
};

// 1. TOGGLE WATCH LATER STATUS
const toggleWatchLater = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const video = await Video.findById(videoId);
    if (!video || !video.isPublished) {
        throw new ApiError(404, "Target video track not found");
    }

    const playlist = await getOrCreateWatchLaterPlaylist(req.user._id);
    const isSaved = playlist.videos.includes(videoId);

    if (isSaved) {
        playlist.videos.pull(videoId);
        await playlist.save();
        return res
            .status(200)
            .json(new ApiResponse(200, { isSaved: false }, "Removed from Watch Later successfully"));
    }

    playlist.videos.push(videoId);
    await playlist.save();
    return res
        .status(200)
        .json(new ApiResponse(200, { isSaved: true }, "Saved to Watch Later successfully"));
});

// 2. GET ALL WATCH LATER VIDEOS
const getWatchLaterVideos = asyncHandler(async (req, res) => {
    const playlist = await Playlist.findOne({
        owner: req.user._id,
        name: "Watch Later"
    }).populate({
        path: "videos",
        match: { isPublished: true },
        select: "title thumbnailUrl views duration createdAt owner",
        populate: {
            path: "owner",
            select: "username fullName avatar"
        }
    });

    const videosList = playlist ? playlist.videos : [];

    return res
        .status(200)
        .json(new ApiResponse(200, videosList, "Watch Later videos compiled successfully"));
});

export { toggleWatchLater, getWatchLaterVideos };