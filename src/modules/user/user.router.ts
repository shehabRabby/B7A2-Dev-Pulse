import express from "express";
import { UserController } from "./user.controller.js";

const router = express.Router();


router.post("/signup", UserController.registerUser);

export const UserRoutes = router;