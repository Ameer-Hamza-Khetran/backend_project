import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler( async (req, res) => {
    // step1: get the user detail from frontend (for now postman) according to the user Schmea
    // step2: check if everything is valid
    // step3: check if user already exists: username, email
    // step4: check for images, check for avatar
    // step5: upload them to cloudinary, avatar
    // step6: create user object - create entry in db
    // step7: remove password and refresh token from response
    // step8: check for user creation
    // step9: return response

    let avatarLocalFilePath;
    if (req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0) {
        avatarLocalFilePath = req.files.avatar[0].path;
    }

    let coverImageLocalFilePath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalFilePath = req.files.coverImage[0].path;
    }

    const {username, email, fullname, password} = req.body

    if([username, email, fullname, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with this email or username already exists")
    }

    if(!avatarLocalFilePath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalFilePath);
    const coverImage = await uploadOnCloudinary(coverImageLocalFilePath);

    if (!avatar) {
        throw new ApiError(400, "Avatar not uploaded on cloudinary")
    }

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    return res.status(200).json(
        new ApiResponse(200, createdUser, "user created successfully")
    )
})

export { registerUser }