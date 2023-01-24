import catchAsyncErrors from '../middlewares/catchAsyncErrors.js';
import ErrorHandler from '../utils/errorhandler.js';
import UserModel from '../models/User.model.js';
import jwt from 'jsonwebtoken';
import bcrypt from "bcrypt";
import factory from './factory.controller.js';


const signJwtToken = (id, type) => {
    switch (type) {
        case 'refresh':
            return jwt.sign({ id }, process.env.REFRESH_TOKEN_SECRET, {
                expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
            });
        case 'access':
            return jwt.sign({ id }, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN,
            });
        default:
            return null;
    }
};

const sendResponseWithToken = async (user, statusCode, req, res) => {
    const accessToken = signJwtToken(user._id, 'access');
    const refreshToken = signJwtToken(user._id, 'refresh');
    user.refresh_tokens = [refreshToken];
    const savedUser = await user.save();
    const tokens = { access_token: accessToken, refresh_token: refreshToken };

    // code for using http only secure cookie
    // const cookieExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    // res.cookie("jwt", token, {
    //   expires: cookieExpiry,
    //   httpOnly: true,
    //   secure: req.secure || req.headers["x-forwarded-proto"] === "https",
    // });

    user?.password && (user.password = undefined);
    user?.refresh_tokens && (user.refresh_tokens = undefined);
    user.__v = undefined;

    res.status(statusCode).json({
        success: true,
        data: {
            user: user,
            tokens,
        },
    });
};

const getAccessRefreshToken = (Model) =>
    catchAsyncErrors(async (req, res, next) => {
        const { refresh_token } = req.body;
        const refreshToken = refresh_token;
        if (!refreshToken) return next(new ErrorHandler('Please provide refresh token', 401));
        const foundUser = await Model.findOne({
            refresh_tokens: refreshToken,
        })
            .select('refresh_tokens')
            .exec();

        // after detecting refresh token reuse:
        if (!foundUser) {
            jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async (err, decoded) => {
                if (err) {
                    return next(new ErrorHandler('Invalid refresh token. Please login again', 401));
                }
                console.log('Warning!Attempted refresh token reuse.');
                const compromisedUser = await Model.findById(decoded.id).exec();
                if (compromisedUser) {
                    compromisedUser.refresh_tokens = [];
                    await compromisedUser.save();
                }
            });

            return next(new ErrorHandler('Attempted refresh token reuse. Please login again', 401));
        }

        // refresh token is not reused.
        // removing current refresh token from user's refresh tokens array
        const newRefreshTokens = foundUser.refresh_tokens.filter((token) => token !== refreshToken);

        // verifying refresh token
        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async (err, decoded) => {
            // if refresh token is invalid
            if (err) {
                foundUser.refresh_tokens = newRefreshTokens;
                await foundUser.save();
                return next(new ErrorHandler('Refresh token expired.Please log in again', 401));
            }
            // if refresh token sent with request doesn't match with the one in database
            if (foundUser.id !== decoded.id)
                return next(new ErrorHandler('Authentication failed. Please log in again', 401));
            // generating new refresh and access tokens
            const newRefreshToken = signJwtToken(decoded.id, 'refresh');
            const newAccessToken = signJwtToken(decoded.id, 'access');
            newRefreshTokens.push(newRefreshToken);
            foundUser.refresh_tokens = newRefreshTokens;
            await foundUser.save();

            res.status(200).json({
                success: true,
                data: {
                    refresh_token: newRefreshToken,
                    access_token: newAccessToken,
                },
            });
        });
    });

const refreshUserToken = getAccessRefreshToken(UserModel);

const userSignUp = factory.createOne(UserModel, {
    includeKeys: ['name', 'phone', 'email', 'password'],
});

const userLogin = catchAsyncErrors(async (req, res, next) => {
    const { email, password } = req.body;
    const user = await UserModel.findOne({ email })
        .select('+password refresh_tokens name email phone is_super_admin status createdAt')
        .exec();
    if (!user) return next(new ErrorHandler('Invalid email or password', 401));

    const isPasswordMatched = await bcrypt.compare(password, user.password);
    if (!isPasswordMatched) return next(new ErrorHandler('Invalid email or password', 401));

    await sendResponseWithToken(user, 200, req, res);
});

const logout = catchAsyncErrors(async (req, res, next) => {
    req.currentUser.refresh_tokens = [];
    await req.currentUser.save();
    res.status(204).json(null);
});

const authenticate = catchAsyncErrors(async (req, res, next) => {
    let token;
    token = req?.headers?.authorization?.split(' ')[1];
    if (!token) {
        token = req?.cookies?.jwt;
    }
    if (!token) return next(new ErrorHandler('No token provided.', 401));

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await UserModel.findById(decoded.id).select('+refresh_tokens').exec();

    if (user) {
        user.role = 'user';
        req.currentUser = user;
    } else {
        return next(new ErrorHandler('You are not authorized', 403));
    }
    return next();
});

// *****IMPORTANT*****        Following authorize middleware must be used after authentication middleware       *****IMPORTANT*****
const authorize = (
    roles = [],
    options = {}
) => {
    options.authenticateUser = options?.authenticateUser ? options.authenticateUser : false;

    return (req, res, next) => {
        const user = req.currentUser;


        // add other cases based on roles and add logics
        switch (user.role) {
            case 'user':
                if (roles.includes('user')) {
                    if (!options?.authenticateUser) return next();
                    else if (user.id === req.params?.id) return next();
                    return next(new ErrorHandler('You are not authorized to perform this action', 403));
                }
                return next(new ErrorHandler('You are not authorized to perform this action', 403));
            default:
                return next(new ErrorHandler('You are not authorized to perform this action', 403));
        }
    };
};

export default {
    userSignUp,
    userLogin,
    authenticate,
    authorize,
    refreshUserToken,
    logout
};
