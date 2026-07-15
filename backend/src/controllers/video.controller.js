import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Video } from "../models/video.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadVideoToCloudPipeline, uploadToImageKit, deleteFromS3, deleteFromImageKit } from "../utils/cloudStorage.js";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

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

    // Upload raw video to AWS S3 & get back ImageKit HLS tracking URL alongside automated duration metrics
    const uploadResult = await uploadVideoToCloudPipeline(videoFileLocalPath);
    if (!uploadResult) {
        throw new ApiError(500, "Failed to upload video asset to the cloud pipeline");
    }

    // Destructure the values computed inside the updated pipeline utility function (Step 3)
    const { videoUrl, duration } = uploadResult;

    // Upload thumbnail to ImageKit media library
    const thumbnailUrl = await uploadToImageKit(thumbnailLocalPath, "/thumbnails");
    if (!thumbnailUrl) {
        throw new ApiError(500, "Failed to process thumbnail file in cloud storage");
    }

    // Array processing for tags if provided as comma-separated text
    const processedTags = tags && typeof tags === "string" 
        ? tags.split(",").map(tag => tag.trim()) 
        : [];

    // Save record to MongoDB database with auto-calculated duration metrics
    const video = await Video.create({
        videoUrl,
        thumbnailUrl,
        title,
        description,
        category,
        tags: processedTags,
        owner: req.user?._id,
        duration: duration || 0, // ◄── Populated automatically from the destructured pipeline metrics!
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

    // 1. Increment view count systematically per hit
    video.views += 1;
    await video.save({ validateBeforeSave: false });

    // 2. Watch History Log: If a user is logged in, append this video to their history array
    if (req.user?._id) {
        await User.findByIdAndUpdate(
            req.user._id,
            {
                $addToSet: { watchHistory: videoId } // $addToSet ensures the ID is unique in the array
            }
        );
    }

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video record retrieved and added to watch history successfully"));
});

// 4. UPDATE VIDEO DETAILS & THUMBNAIL
const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description, category } = req.body;

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video track not found");
    }

    // Security Guard: Check if the logged-in user actually owns this video
    if (video.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You do not have permission to update this video");
    }

    // Update text fields if provided
    if (title) video.title = title;
    if (description) video.description = description;
    if (category) video.category = category;

    // Handle new thumbnail upload if a file is sent
    const thumbnailLocalPath = req.file?.path;
    if (thumbnailLocalPath) {
        const newThumbnailUrl = await uploadToImageKit(thumbnailLocalPath, "/thumbnails");
        if (!newThumbnailUrl) {
            throw new ApiError(500, "Failed to update thumbnail file in cloud storage");
        }
        video.thumbnailUrl = newThumbnailUrl;
    }

    await video.save();

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video details updated successfully"));
});

// 5. DELETE A VIDEO
const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video track not found");
    }

    // Security Guard: Check ownership
    if (video.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You do not have permission to delete this video");
    }

    // 1. Extract the raw S3 filename from the HLS string
    // Our HLS URL looks like: ...?ik-s=1783621420047-video.mp4&ik-transform=f-hls
    const s3KeyMatch = video.videoUrl.match(/ik-s=([^&]+)/);
    if (s3KeyMatch && s3KeyMatch[1]) {
        const s3Key = s3KeyMatch[1];
        await deleteFromS3(s3Key); // Purge raw video from S3
    }

    // 2. Purge thumbnail from ImageKit Media Library
    if (video.thumbnailUrl) {
        await deleteFromImageKit(video.thumbnailUrl);
    }

    // 3. Remove document record from MongoDB
    await Video.findByIdAndDelete(videoId);

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Video and associated cloud assets removed successfully"));
});

// 6. GET RELATED/RECOMMENDED VIDEOS
const getRelatedVideos = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video identifier format");
    }

    const currentVideo = await Video.findById(videoId);
    if (!currentVideo) {
        throw new ApiError(404, "Target video track not found");
    }

    // Run an aggregation to find similar content matching category or tags
    const recommendations = await Video.aggregate([
        {
            $match: {
                _id: { $ne: new mongoose.Types.ObjectId(videoId) }, // Exclude the current video
                isPublished: true,
                $or: [
                    { category: currentVideo.category },
                    { tags: { $in: currentVideo.tags } }
                ]
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: { $first: "$ownerDetails" }
            }
        },
        {
            $project: {
                ownerDetails: 0
            }
        },
        {
            $limit: 10 // Return a clean top-10 recommended sidebar track list
        }
    ]);

    return res
        .status(200)
        .json(new ApiResponse(200, recommendations, "Related videos compiled successfully"));
});

// 7. GET VIDEOS BY CHANNEL USERNAME
const getVideosByChannel = asyncHandler(async (req, res) => {
    const { username } = req.params;

    if (!username?.trim()) {
        throw new ApiError(400, "Channel username is missing");
    }

    // Find the user first to obtain their Object ID
    const user = await User.findOne({ username: username.toLowerCase().trim() });
    if (!user) {
        throw new ApiError(404, "Channel user not found");
    }

    // Query all published videos owned by this user
    const videos = await Video.find({
        owner: user._id,
        isPublished: true
    })
    .populate("owner", "username fullName avatar")
    .sort({ createdAt: -1 });

    return res
        .status(200)
        .json(new ApiResponse(200, videos, "Channel specific videos retrieved successfully"));
});

export {
    publishAVideo,
    getAllVideos,
    getVideoById,
    updateVideo,  
    deleteVideo,
    getRelatedVideos,
    getVideosByChannel 
};