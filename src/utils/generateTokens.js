import { User } from "../models/user.models"
import { ApiError } from "./ApiError"

function generateAccessAndRefreshTokens(userId) {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})

        return {
            accessToken: accessToken,
            refreshToken: refreshToken
        }
        
    } catch (error) {
        throw new ApiError(500, 'Problem generating access and refresh tokens');
    }
}

export { generateAccessAndRefreshTokens }