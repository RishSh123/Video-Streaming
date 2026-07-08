import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadToImageKit } from "../utils/cloudStorage.js";

// Helper function to generate tokens and update the refresh token in the database
const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating system tokens");
    }
};

// 1. REGISTER USER
const registerUser = asyncHandler(async (req, res) => {
    const { fullName, email, username, password } = req.body;

    // Validate that no fields are empty
    if ([fullName, email, username, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All registration fields are strictly required");
    }

    // Check if user already exists by email or username
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (existedUser) {
        throw new ApiError(409, "User with this email or username already exists");
    }

    // Handle uploaded avatar file from Multer
    // --- REPLACE MOCK ASSIGNMENT WITH THIS CLOUD INTEGRATION ---
    // Handle uploaded avatar file from Multer
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar image file is required");
    }

    // Upload to ImageKit cloud folder explicitly separated for profile media
    const avatarUrl = await uploadToImageKit(avatarLocalPath, "/avatars");
    if (!avatarUrl) {
        throw new ApiError(500, "Failed to upload avatar to cloud media storage");
    }

    let coverImageUrl = "";
    if (req.files?.coverImage?.[0]?.path) {
        coverImageUrl = await uploadToImageKit(req.files.coverImage[0].path, "/cover-images");
    }
    // ------------------------------------------------------------

    // Create and save user in MongoDB
    const user = await User.create({
        fullName,
        avatar: avatarUrl,
        coverImage: coverImageUrl,
        username: username.toLowerCase(),
        email,
        password
    });

    // Fetch the created user record excluding password and refresh token
    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    return res.status(201).json(
        new ApiResponse(201, createdUser, "User registered successfully!")
    );
});

// 2. LOGIN USER
const loginUser = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body;

    if (!username && !email) {
        throw new ApiError(400, "Username or email is required to login");
    }

    // Find user by username OR email
    const user = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    // Validate password using our schema method
    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials");
    }

    // Generate tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    // Get clean user data
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    // Options for secure cookies
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict"
    };

    // Send response with secure cookies
    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
            new ApiResponse(
                200,
                { user: loggedInUser, accessToken, refreshToken },
                "User logged in successfully"
            )
        );
});

// 3. LOGOUT USER
const logoutUser = asyncHandler(async (req, res) => {
    // Clear the refresh token from MongoDB
    await User.findByIdAndUpdate(
        req.user._id,
        { $unset: { refreshToken: 1 } }, // Removes the field from document
        { new: true }
    );

    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict"
    };

    // Clear cookies from user's browser
    return res
        .status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(new ApiResponse(200, {}, "User logged out successfully"));
});

// 4. CHANGE CURRENT PASSWORD
const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        throw new ApiError(400, "Both old and new passwords are required");
    }

    // req.user is supplied directly by our verifyJWT middleware
    const user = await User.findById(req.user?._id);
    
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if (!isPasswordCorrect) {
        throw new ApiError(401, "Invalid current password");
    }

    // Assign the new plain text password; our pre-save hook will encrypt it automatically
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"));
});

// 5. UPDATE ACCOUNT DETAILS
const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body;

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required to update settings");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email
            }
        },
        { new: true } // Returns the modified document instead of the old one
    ).select("-password -refreshToken");

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Account details updated successfully"));
});

// 6. UPDATE USER AVATAR
const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path; // Multer saves single files to req.file

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing");
    }

    // Mock cloud URL pathway for Milestone 2
    const avatarUrl = await uploadToImageKit(avatarLocalPath, "/avatars");
    if (!avatarUrl) {
        throw new ApiError(500, "Failed to upload new avatar asset");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatarUrl
            }
        },
        { new: true }
    ).select("-password -refreshToken");

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Avatar image updated successfully"));
});


export { 
    registerUser, 
    loginUser, 
    logoutUser, 
    changeCurrentPassword, 
    updateAccountDetails, 
    updateUserAvatar 
};