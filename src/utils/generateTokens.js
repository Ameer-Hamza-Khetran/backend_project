import { User } from "../models/user.models.js"
import { ApiError } from "./ApiError.js"

async function generateAccessAndRefreshTokens(userId) {
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