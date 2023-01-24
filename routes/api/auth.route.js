import express from "express";
import authController from "../../controllers/auth.controller.js";

const authRoute = express.Router();

authRoute.post("/user/signup", authController.userSignUp);
authRoute.post("/user/login", authController.userLogin);
authRoute.post("/user/token", authController.refreshUserToken);
authRoute.post("/user/logout", authController.authenticate, authController.logout);

export default authRoute;
