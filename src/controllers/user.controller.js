import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { generateAccessAndRefreshTokens } from "../utils/generateTokens.js";
import jwt from 'jsonwebtoken'

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

const loginUser = asyncHandler(async (req, res) => {
    // take data from req.body
    // validate data of body
    // find user in db and validate
    // compare passwords
    // generate access and refresh tokens
    // send tokens in cookies. optionally send tokens to user if they require.
    // login user.

    const {username, email, password} = req.body

    if (!username && !email) {
        throw new ApiError(400, "Username or email is required")
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if (!user) {
        throw new ApiError(404, 'User does not exist')
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid) {
        throw new ApiError(401, 'Invalid user credentials')
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    return res
    .status(200)
    .cookie("accessToken", accessToken, { httpOnly: true, secure: true })
    .cookie("refreshToken", refreshToken, { httpOnly: true, secure: true })
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser,
                accessToken: accessToken,
                refreshToken: refreshToken
            },
            "User loggedin successfully"
        )
    )
})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, {
        $unset: {
            refreshToken: 1
        }
    }, {
        returnDocument: "after"
    })

    return res
    .status(200)
    .clearCookie("accessToken", {httpOnly: true, secure: true})
    .clearCookie("refreshToken", {httpOnly: true, secure: true})
    .json( new ApiResponse(200, {}, "User logged Out"))
})

const generateNewTokens = asyncHandler( async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, 'Invalid refresh token')
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, 'Refresh token is expired or used')
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        return res
        .status(200)
        .cookie('accessToken', accessToken, {httpOnly: true, secure: true})
        .cookie('refreshToken', newRefreshToken, {httpOnly: true, secure: true})
        .json(
            new ApiResponse(200, {
                accessToken: accessToken,
                refreshToken: newRefreshToken
            }, 'Access token refreshed')
        )
    } catch (error) {
        throw new ApiError(401, error?.message || 'Invalid Refresh token')
    }

})

const changeCurrentPassword = asyncHandler( async (req, res) => {
    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, 'Invalid old Password')
    }

    user.password = newPassword

    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, 'Password Changed Succesfully'))

})

const getCurrentUser = asyncHandler( async (req, res) => {
    return res
    .status(200)
    .json(new ApiResponse(200, req.user, 'current user fetched successfully'))
})

const updateAccountDetails = asyncHandler( async (req, res) => {
    const {fullname, email} = req.body

    if (!fullname && !email) {
        throw new ApiError(400, 'All fields are required')
    }

    const user = await User.findByIdAndUpdate(req.user?._id, {$set: {
        fullname: fullname,
        email: email
    }}, {new: true}).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, 'Account details updated successfully'))
})

const updateUserAvatar = asyncHandler( async (req, res) => {
    const avatarLocalFilePath = req.file?.path

    if (!avatarLocalFilePath) {
        throw new ApiError(400, 'Avatar file is missing')
    }

    const avatar = await uploadOnCloudinary(avatarLocalFilePath)

    if (!avatar.url) {
        throw new ApiError(500, 'Error while uploading avatar on cloudinary')
    }

    const user = await User.findByIdAndUpdate(req.user?._id, {$set: {
        avatar: avatar.url
    }}, {new: true}).select("-password")

    return res
    .status(201)
    .json(new ApiResponse(201, user, 'User avatar updated successfully'))
})

const updateUserCoverImage = asyncHandler( async (req, res) => {
    const coverImageLocalFilePath = req.file?.path

    if (!coverImageLocalFilePath) {
        throw new ApiError(400, 'Cover image is missing')
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalFilePath)

    if(!coverImage.url) {
        throw new ApiError(500, 'Error while uploading cover image on cloudinary')
    }

    const user = User.findByIdAndUpdate(req.user?._id, {$set: {
        coverImage: coverImage.url
    }}, {new: true}).select("-password")

    return res
    .status(201)
    .json(new ApiResponse(201, user, 'user cover image updated successfully'))
})

export { 
    registerUser,
    loginUser,
    logoutUser,
    generateNewTokens,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
}