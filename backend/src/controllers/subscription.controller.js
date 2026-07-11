import mongoose, { isValidObjectId } from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// 1. TOGGLE SUBSCRIPTION STATUS (Subscribe / Unsubscribe)
const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel identifier format");
    }

    // Verify channel exists and prevent users from subscribing to themselves
    const channel = await User.findById(channelId);
    if (!channel) {
        throw new ApiError(404, "Target channel or creator profile not found");
    }

    if (channelId.toString() === req.user?._id.toString()) {
        throw new ApiError(400, "Self-subscription is restricted within system design rules");
    }

    // Check if subscription mapping already exists
    const existingSub = await Subscription.findOne({
        subscriber: req.user?._id,
        channel: channelId
    });

    if (existingSub) {
        // Unsubscribe: delete entry
        await Subscription.findByIdAndDelete(existingSub._id);
        return res
            .status(200)
            .json(new ApiResponse(200, { isSubscribed: false }, "Unsubscribed from channel successfully"));
    }

    // Subscribe: create entry
    await Subscription.create({
        subscriber: req.user?._id,
        channel: channelId
    });

    return res
        .status(200)
        .json(new ApiResponse(200, { isSubscribed: true }, "Subscribed to channel successfully"));
});

// 2. FETCH SUBSCRIBER CHANNELS (Who is subscribed to THIS channel?)
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel identifier format");
    }

    // Map all subscriber metrics utilizing an aggregation pipeline
    const subscribersList = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriberDetails",
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
                subscriber: { $first: "$subscriberDetails" }
            }
        },
        {
            $project: {
                subscriberDetails: 0
            }
        }
    ]);

    return res
        .status(200)
        .json(new ApiResponse(200, subscribersList, "Channel subscriber list retrieved successfully"));
});

// 3. FETCH CHANNELS SUBSCRIBED TO (Which channels is THIS user following?)
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriber identifier format");
    }

    // Gather channel metrics utilizing an aggregation pipeline
    const channelsList = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channelDetails",
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
                channel: { $first: "$channelDetails" }
            }
        },
        {
            $project: {
                channelDetails: 0
            }
        }
    ]);

    return res
        .status(200)
        .json(new ApiResponse(200, channelsList, "Subscribed channels directory retrieved successfully"));
});

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
};