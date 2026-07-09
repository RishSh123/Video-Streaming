import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Video } from "../models/video.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadVideoToCloudPipeline, uploadToImageKit } from "../utils/cloudStorage.js";

// 1. PUBLISH A VIDEO
const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description, category, tags } = req.body;

    if ([title, description, category].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "Title, description, and category fields are strictly required");
    }

    // Extract local file paths from Multer fields
    const videoFileLocalPath = req.files?.videoFile?.[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

    if (!videoFileLocalPath) {
        throw new ApiError(400, "Video track file (.mp4) is required");
    }
    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail image file is required");
    }

    // Upload raw video to AWS S3 & get back ImageKit HLS tracking URL
    const videoUrl = await uploadVideoToCloudPipeline(videoFileLocalPath);
    if (!videoUrl) {
        throw new ApiError(500, "Failed to upload video asset to the cloud pipeline");
    }

    // Upload thumbnail to ImageKit media library
    const thumbnailUrl = await uploadToImageKit(thumbnailLocalPath, "/thumbnails");
    if (!thumbnailUrl) {
        throw new ApiError(500, "Failed to process thumbnail file in cloud storage");
    }

    // Array processing for tags if provided as comma-separated text
    const processedTags = tags && typeof tags === "string" 
        ? tags.split(",").map(tag => tag.trim()) 
        : [];

    // Save record to MongoDB database
    const video = await Video.create({
        videoUrl,
        thumbnailUrl,
        title,
        description,
        category,
        tags: processedTags,
        owner: req.user?._id, // Set video ownership using our verified session user
        isPublished: true
    });

    return res
        .status(201)
        .json(new ApiResponse(201, video, "Video uploaded and processed into HLS successfully!"));
});

// 2. GET ALL VIDEOS (With filtering)
const getAllVideos = asyncHandler(async (req, res) => {
    const { query, category } = req.query;
    const filter = {};

    // Filter by text search query across title/description
    if (query) {
        filter.$or = [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } }
        ];
    }

    // Filter by category
    if (category) {
        filter.category = category;
    }

    // Only fetch public videos
    filter.isPublished = true;

    // Fetch records and populate the owner object excluding sensitive attributes
    const videos = await Video.find(filter)
        .populate("owner", "username fullName avatar")
        .sort({ createdAt: -1 });

    return res
        .status(200)
        .json(new ApiResponse(200, videos, "Videos fetched successfully"));
});

// 3. GET VIDEO BY ID
const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const video = await Video.findById(videoId).populate("owner", "username fullName avatar");

    if (!video || !video.isPublished) {
        throw new ApiError(404, "Video track not found");
    }

    // Increment view count systematically per hit
    video.views += 1;
    await video.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video record retrieved successfully"));
});

export {
    publishAVideo,
    getAllVideos,
    getVideoById
};