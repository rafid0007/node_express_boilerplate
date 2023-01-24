import express from "express";
import userController from "../../controllers/user.controller.js";
import authController from "../../controllers/auth.controller.js";

const userRoute = express.Router();


// CREATE A USER
userRoute.post("/", userController.createUser);

// GETTING ALL USERS
userRoute.get("/", userController.getAllUsers);

// GET A SINGLE USER
userRoute.get("/:id", userController.getUser);

// UPDATE A SINGLE USER
userRoute.put("/:id", userController.updateUser);

// DELETE A SINGLE USER
userRoute.delete("/:id", userController.deleteUser);

export default userRoute;
