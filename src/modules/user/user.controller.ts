import { type Request, type Response, type NextFunction } from "express";
import { UserServices } from "./user.service.js";
import sendResponse from "../../utils/sendResponse.js";
import { StatusCodes } from "http-status-codes";

const registerUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userData = req.body;

    // রিকোয়ারমেন্ট অনুযায়ী ইমেইল ও পাসওয়ার্ড দেওয়া আছে কিনা তা চেক করা (বেসিক ভ্যালিডেশন)
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

export const UserController = {
  registerUser,
};