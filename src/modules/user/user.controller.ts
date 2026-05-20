import { type Request, type Response, type NextFunction } from "express";
import { UserServices } from "./user.service.js";
import sendResponse from "../../utils/sendResponse.js";
import { StatusCodes } from "http-status-codes";

const registerUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userData = req.body;

    if (!userData.email || !userData.password || !userData.name) {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Validation error",
        errors: "Name, email, and password are required in this fields."
      });
      return;
    }

    // create user into Database
    const result = await UserServices.createUserIntoDB(userData);

    
    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "User registered successfully",
      data: result,
    });
  } catch (error: any) {
    if (error.code === "23505") {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Validation error",
        errors: "Email already exists."
      });
      return;
    }
    next(error);
  }
};

const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const loginData = req.body;

    if (!loginData.email || !loginData.password) {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Validation error",
        errors: "Email and password are required."
      });
      return;
    }

    const result = await UserServices.loginUserFromDB(loginData);

    sendResponse(res, {
      statusCode: StatusCodes.OK, 
      success: true,
      message: "Login successful",
      data: {
        token: result.token,
        user: result.user,
      },
    });
  } catch (error: any) {
    if (error.message === "Invalid email or password") {
      res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Authentication failed",
        errors: "Invalid email or password"
      });
      return;
    }
    next(error);
  }
};

export const UserController = {
  registerUser,loginUser
};